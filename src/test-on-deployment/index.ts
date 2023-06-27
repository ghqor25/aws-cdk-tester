import { CustomResource, Duration, aws_lambda, aws_lambda_nodejs, aws_logs, aws_stepfunctions, aws_stepfunctions_tasks } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Tester, TesterOutput, TesterProps } from '../tester/index.js';
import { getOrCreateLambdaFunction, resolveESM } from '../lib/index.js';

export interface TestOnDeploymentInput {
   logicalResourceId: string;
   physicalResourceId: string;
   requestId: string;
   stackId: string;
   responseUrl: string;
}

export interface TestOnDeploymentOutput extends TesterOutput {
   status: 'SUCCEEDED' | 'FAILED';
}

export interface TestOnDeploymentProps extends Pick<TesterProps, 'testCases'> {
   /**
    * if true, test will proceed.
    * @default true
    */
   enabled?: boolean;
   /**
    * Overall timeout.
    * @default Duration.hours(1)
    */
   totalTimeout?: Duration;
   /**
    * if set, it will log all tests.
    */
   logGroup?: aws_logs.ILogGroup;
}

export class TestOnDeployment extends Construct {
   public readonly testerStateMachine: aws_stepfunctions.StateMachine;
   public readonly stateMachine: aws_stepfunctions.StateMachine;
   constructor(scope: Construct, id: string, props: TestOnDeploymentProps) {
      super(scope, id);
      const totalTimeOut = props.totalTimeout ?? Duration.hours(1);
      const classId = 'TestOnDeployment';

      this.testerStateMachine = new Tester(this, 'Tester', { testCases: props.testCases, totalTimeout: totalTimeOut }).stateMachine;

      const failExecuteTester = new aws_stepfunctions.Pass(this, 'Fail-ExecuteTester', {
         parameters: { Output: aws_stepfunctions.JsonPath.stringToJson(aws_stepfunctions.JsonPath.stringAt('$.Cause')) },
         outputPath: '$.Output',
      });

      const taskExecuteTester = new aws_stepfunctions_tasks.StepFunctionsStartExecution(this, 'Task-ExecuteTester', {
         stateMachine: this.testerStateMachine,
         integrationPattern: aws_stepfunctions.IntegrationPattern.RUN_JOB,
         taskTimeout: aws_stepfunctions.Timeout.duration(totalTimeOut.plus(Duration.minutes(2))),
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

      const parallelAfterTester = new aws_stepfunctions.Parallel(this, 'AfterTester', { resultPath: aws_stepfunctions.JsonPath.DISCARD });
      failExecuteTester.next(parallelAfterTester);

      const taskResponseCloudformation = new aws_stepfunctions_tasks.LambdaInvoke(this, 'Task-ResponseCloudformation', {
         lambdaFunction: getOrCreateLambdaFunction(this, `${classId}-ResponseCloudformation-Lambda-zmb9WE`, {
            entry: resolveESM(import.meta, 'lambda', 'response-cloudformation.ts'),
            runtime: aws_lambda.Runtime.NODEJS_18_X,
            bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
         }),
         resultPath: aws_stepfunctions.JsonPath.DISCARD,
      }).addCatch(
         new aws_stepfunctions.Pass(this, 'Fail-ResponseCloudformation', {
            parameters: { Output: aws_stepfunctions.JsonPath.stringToJson(aws_stepfunctions.JsonPath.stringAt('$.Cause')) },
            outputPath: '$.Output',
         }),
      );
      parallelAfterTester.branch(taskResponseCloudformation);

      if (props.logGroup) {
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

      this.stateMachine = new aws_stepfunctions.StateMachine(this, 'StateMachine', {
         definition: taskExecuteTester.next(choiceJudgeTester).next(parallelAfterTester),
         timeout: totalTimeOut.plus(Duration.minutes(10)),
      });

      const customResourceProviderLambda = new aws_lambda_nodejs.NodejsFunction(this, 'CustomResourceProvider-Lambda', {
         entry: resolveESM(import.meta, 'lambda', 'customresource-provider.ts'),
         runtime: aws_lambda.Runtime.NODEJS_18_X,
         bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
         environment: { STATE_MACHINE_ARN: this.stateMachine.stateMachineArn },
      });
      this.stateMachine.grantStartExecution(customResourceProviderLambda);

      new CustomResource(this, 'CustomResource', {
         serviceToken: customResourceProviderLambda.functionArn,
         resourceType: `Custom::${classId}`,
         properties: { time: new Date().getTime(), enabled: props.enabled ?? true },
      });
   }
}
