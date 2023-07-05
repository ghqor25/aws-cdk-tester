import { Duration, aws_lambda, aws_lambda_nodejs, aws_stepfunctions, aws_stepfunctions_tasks } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { AggregationResponse } from './lambda/aggregation.js';
import { findDuplicatedFirst, getOrCreateLambdaFunction, resolveESM } from '../../lib/index.js';

export interface TesterOutput extends AggregationResponse {}

export interface TestCase {
   /**
    * Identifier of testCase. Should be unique in all defined testCases. \
    * Recommend to name it recognizable, so you can know which test is.
    */
   id: string;
   /**
    * Steps in a single testCase.
    */
   steps: {
      /**
       * If lambda throws any error, the testCase will result in `fail`. \
       * If lambda returns anything, returned payload will be passed to next step's lambda as `event.body`.
       */
      lambdaFunction: aws_lambda.IFunction;
      /**
       * Interval before invoking this step. \
       * If not set, the step will be invoked immediately.
       */
      interval?: Duration;
   }[];
   /**
    * If this testCase is necessary to succeed, set true. \
    * If set false, the test will not be `FAILED` even if this testCase is `fail`
    * @default true
    */
   required?: boolean;
   /**
    * If you set input variables, it will be passed to first step's lambda as `event.body`.
    */
   input?: Record<string, any>;
}

export interface TesterProps {
   /**
    * TestCases will be tested in parallel. \
    * Each testCase results `pass` or `fail`.
    */
   testCases: TestCase[];
   /**
    * Overall timeout.
    * @default no timeout.
    */
   totalTimeout?: Duration;
}

/**
 * Internal tester. It tests and aggregates the result.
 * @internal
 */
export class Tester extends Construct {
   public readonly stateMachine: aws_stepfunctions.StateMachine;

   constructor(scope: Construct, id: string, props: TesterProps) {
      super(scope, id);
      const classId = 'Tester';
      const duplicatedId = findDuplicatedFirst(props.testCases.map(testCase => testCase.id));
      if (duplicatedId) throw new Error(`Duplicated test case's id: ${duplicatedId}`);

      const parallelTestCases = new aws_stepfunctions.Parallel(this, 'TestCases', {
         inputPath: aws_stepfunctions.JsonPath.DISCARD,
         resultSelector: { 'testCases.$': '$' },
      }).branch(
         ...props.testCases.map(testCase =>
            testCase.steps.reduce((chainPrevious, stepInfo, stepIndex) => {
               const nameCurrent = `${testCase.id}-${stepIndex}`;

               const taskTest = new aws_stepfunctions_tasks.LambdaInvoke(this, `Test-${nameCurrent}`, {
                  lambdaFunction: stepInfo.lambdaFunction,
                  resultSelector: { 'body.$': '$.Payload' },
               }).addCatch(
                  new aws_stepfunctions.Pass(this, `Fail-${nameCurrent}`, {
                     parameters: {
                        'body.$': '$',
                        id: testCase.id,
                        stepIndex,
                        status: 'fail',
                        required: testCase.required ?? true,
                     },
                  }),
               );

               const chainIfWaitAndTest = stepInfo.interval
                  ? new aws_stepfunctions.Wait(this, `Wait-${nameCurrent}`, { time: aws_stepfunctions.WaitTime.duration(stepInfo.interval) }).next(taskTest)
                  : taskTest;

               const chainCurrent = chainPrevious ? chainPrevious.next(chainIfWaitAndTest) : chainIfWaitAndTest;

               // if step is continue, just return
               if (stepIndex < testCase.steps.length - 1) return chainCurrent;
               // if step is at the end, return with pass state.
               else if (stepIndex === testCase.steps.length - 1)
                  return chainCurrent.next(
                     new aws_stepfunctions.Pass(this, `Succeed-${nameCurrent}`, {
                        parameters: {
                           'body.$': '$.body',
                           id: testCase.id,
                           status: 'pass',
                        },
                     }),
                  );
               else throw new Error('Index error. It should not happen. Please let me know.');
            }, (testCase.input ? new aws_stepfunctions.Pass(this, `Input-${testCase.id}`, { parameters: testCase.input }) : undefined) as unknown as aws_stepfunctions.INextable & aws_stepfunctions.IChainable),
         ),
      );

      const aggregation = new aws_stepfunctions_tasks.LambdaInvoke(this, 'Aggregation', {
         lambdaFunction: getOrCreateLambdaFunction(this, `${classId}-Aggregation-Lambda-zmb9WE`, {
            entry: resolveESM(import.meta, 'lambda', 'aggregation.ts'),
            runtime: aws_lambda.Runtime.NODEJS_18_X,
            bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
         }),
         outputPath: '$.Payload',
      });

      this.stateMachine = new aws_stepfunctions.StateMachine(this, 'StateMachine', {
         definitionBody: aws_stepfunctions.DefinitionBody.fromChainable(parallelTestCases.next(aggregation)),
         timeout: props.totalTimeout,
      });
   }
}
