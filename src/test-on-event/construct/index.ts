import {
   Duration,
   aws_events,
   aws_iam,
   aws_lambda,
   aws_lambda_nodejs,
   aws_logs,
   aws_scheduler,
   aws_sns,
   aws_stepfunctions,
   aws_stepfunctions_tasks,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tester, type TesterOutput, type TesterProps } from '../../tester/construct/index.js';
import { resolveESM } from '../../lib/index.js';

export interface TestOnEventOutput extends TesterOutput {
   status: 'SUCCEEDED' | 'FAILED';
}

interface TestOnEventSnsEventDefault {
   /**
    * test start time - epoch time in milliseconds.
    */
   timeStart: number;
   /**
    * test end time - epoch time in milliseconds.
    */
   timeEnd: number;
}

/**
 * Sns publish message body when test done.
 */
export interface TestOnEventSnsEvent extends TestOnEventOutput, TestOnEventSnsEventDefault {}
/**
 * Sns publish message body when error occur(ex. TIMED_OUT).
 */
export interface TestOnEventWhenErrorSnsEvent extends TestOnEventSnsEventDefault {
   status: 'FAILED' | 'TIMED_OUT';
}

export interface TestOnEventProps extends Pick<TesterProps, 'testCases'> {
   /**
    * Test will be invoked within schedule.
    */
   schedule: aws_events.Schedule;
   /**
    * Overall timeout.
    * @default no timeout.
    */
   totalTimeout?: Duration;
   /**
    * If set, it will automatically log each test.
    */
   logGroup?: aws_logs.ILogGroup;
   /**
    * If set, it will publish when test done.
    */
   snsTopic?: aws_sns.ITopic;
   /**
    * If set, it will publish when error occur(ex. TIMED_OUT).
    */
   snsTopicWhenError?: aws_sns.ITopic;
}

/**
 * Do test on scheduled date.
 */
export class TestOnEvent extends Construct {
   constructor(scope: Construct, id: string, props: TestOnEventProps) {
      super(scope, id);

      const testerStateMachine = new Tester(this, 'Tester', { testCases: props.testCases, totalTimeout: props.totalTimeout }).stateMachine;

      const failExecuteTester = new aws_stepfunctions.Pass(this, 'Fail-ExecuteTester', {
         parameters: { Output: aws_stepfunctions.JsonPath.stringToJson(aws_stepfunctions.JsonPath.stringAt('$.Cause')) },
         outputPath: '$.Output',
      });

      const taskExecuteTester = new aws_stepfunctions_tasks.StepFunctionsStartExecution(this, 'Task-ExecuteTester', {
         stateMachine: testerStateMachine,
         integrationPattern: aws_stepfunctions.IntegrationPattern.RUN_JOB,
         taskTimeout: props.totalTimeout ? aws_stepfunctions.Timeout.duration(props.totalTimeout.plus(Duration.minutes(2))) : undefined,
      }).addCatch(failExecuteTester);

      const choiceJudgeTester = new aws_stepfunctions.Choice(this, 'Choice-JudgeTester')
         .when(
            aws_stepfunctions.Condition.numberEquals('$.Output.result.fail.required', 0),
            new aws_stepfunctions.Pass(this, 'Succeeded-JudgeTester', {
               result: { value: 'SUCCEEDED' },
               resultPath: '$.Output.status',
            }),
         )
         .otherwise(
            new aws_stepfunctions.Pass(this, 'Failed-JudgeTester', {
               result: { value: 'FAILED' },
               resultPath: '$.Output.status',
            }),
         )
         .afterwards();

      const parallelAfterTester =
         props.logGroup || props.snsTopic ? new aws_stepfunctions.Parallel(this, 'AfterTester', { resultPath: aws_stepfunctions.JsonPath.DISCARD }) : undefined;
      if (parallelAfterTester) failExecuteTester.next(parallelAfterTester);

      if (parallelAfterTester && (props.snsTopic || props.snsTopicWhenError)) {
         parallelAfterTester.branch(
            new aws_stepfunctions.Choice(this, 'Choice-SnsPublish')
               .when(
                  aws_stepfunctions.Condition.stringEquals('$.Status', 'SUCCEEDED'),
                  props.snsTopic
                     ? new aws_stepfunctions_tasks.SnsPublish(this, 'SnsPublish-WhenDone', {
                          topic: props.snsTopic,
                          message: aws_stepfunctions.TaskInput.fromObject({
                             status: aws_stepfunctions.JsonPath.stringAt('$.Output.status'),
                             result: aws_stepfunctions.JsonPath.stringAt('$.Output.result'),
                             logs: aws_stepfunctions.JsonPath.stringAt('$.Output.logs'),
                             timeStart: aws_stepfunctions.JsonPath.stringAt('$.StartDate'),
                             timeEnd: aws_stepfunctions.JsonPath.stringAt('$.StopDate'),
                          }),
                          messageAttributes: {
                             status: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.STRING,
                                value: aws_stepfunctions.JsonPath.stringAt('$.Output.status'),
                             },
                             total: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.NUMBER,
                                value: aws_stepfunctions.JsonPath.format('{}', aws_stepfunctions.JsonPath.stringAt('$.Output.result.total')),
                             },
                             pass: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.NUMBER,
                                value: aws_stepfunctions.JsonPath.format('{}', aws_stepfunctions.JsonPath.stringAt('$.Output.result.pass')),
                             },
                             failTotal: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.NUMBER,
                                value: aws_stepfunctions.JsonPath.format('{}', aws_stepfunctions.JsonPath.stringAt('$.Output.result.fail.total')),
                             },
                             failRequired: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.NUMBER,
                                value: aws_stepfunctions.JsonPath.format('{}', aws_stepfunctions.JsonPath.stringAt('$.Output.result.fail.required')),
                             },
                             failOptional: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.NUMBER,
                                value: aws_stepfunctions.JsonPath.format('{}', aws_stepfunctions.JsonPath.stringAt('$.Output.result.fail.optional')),
                             },
                          },
                          resultPath: aws_stepfunctions.JsonPath.DISCARD,
                       })
                     : new aws_stepfunctions.Pass(this, 'Pass-WhenDone'),
               )
               .otherwise(
                  props.snsTopicWhenError
                     ? new aws_stepfunctions_tasks.SnsPublish(this, 'SnsPublish-WhenError', {
                          topic: props.snsTopicWhenError,
                          message: aws_stepfunctions.TaskInput.fromObject({
                             status: aws_stepfunctions.JsonPath.stringAt('$.Status'),
                             timeStart: aws_stepfunctions.JsonPath.stringAt('$.StartDate'),
                             timeEnd: aws_stepfunctions.JsonPath.stringAt('$.StopDate'),
                          }),
                          messageAttributes: {
                             status: {
                                dataType: aws_stepfunctions_tasks.MessageAttributeDataType.STRING,
                                value: aws_stepfunctions.JsonPath.stringAt('$.Status'),
                             },
                          },
                          resultPath: aws_stepfunctions.JsonPath.DISCARD,
                       })
                     : new aws_stepfunctions.Pass(this, 'Pass-WhenError'),
               ),
         );
      }

      if (parallelAfterTester && props.logGroup) {
         const createLogLambda = new aws_lambda_nodejs.NodejsFunction(this, 'CreateLog-Lambda', {
            entry: resolveESM(import.meta, 'lambda', 'create-log.ts'),
            runtime: aws_lambda.Runtime.NODEJS_18_X,
            bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            environment: {
               LOG_GROUP_NAME: props.logGroup.logGroupName,
            },
         });
         props.logGroup.grantWrite(createLogLambda);

         const taskCreateLog = new aws_stepfunctions_tasks.LambdaInvoke(this, 'Task-CreateLog', {
            lambdaFunction: createLogLambda,
            resultPath: aws_stepfunctions.JsonPath.DISCARD,
         }).addCatch(
            new aws_stepfunctions.Pass(this, 'Fail-CreateLog', {
               parameters: { Output: aws_stepfunctions.JsonPath.stringToJson(aws_stepfunctions.JsonPath.stringAt('$.Cause')) },
               outputPath: '$.Output',
            }),
         );

         parallelAfterTester.branch(taskCreateLog);
      }

      const chainJudgeTesterAndIfAfterTester = parallelAfterTester ? choiceJudgeTester.next(parallelAfterTester) : choiceJudgeTester;

      const stateMachine = new aws_stepfunctions.StateMachine(this, 'StateMachine', {
         definitionBody: aws_stepfunctions.DefinitionBody.fromChainable(taskExecuteTester.next(chainJudgeTesterAndIfAfterTester)),
         timeout: props.totalTimeout ? props.totalTimeout.plus(Duration.minutes(10)) : undefined,
      });

      const roleStartExecution = new aws_iam.Role(this, 'StartExecution-Role', { assumedBy: new aws_iam.ServicePrincipal('scheduler.amazonaws.com') });
      stateMachine.grantStartExecution(roleStartExecution);
      new aws_scheduler.CfnSchedule(this, 'StartExecution-Schedule', {
         scheduleExpression: props.schedule.expressionString,
         flexibleTimeWindow: { mode: 'OFF' } satisfies aws_scheduler.CfnSchedule.FlexibleTimeWindowProperty,
         target: {
            arn: stateMachine.stateMachineArn,
            roleArn: roleStartExecution.roleArn,
         } satisfies aws_scheduler.CfnSchedule.TargetProperty,
      });
   }
}
