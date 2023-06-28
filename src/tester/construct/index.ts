import { Duration, aws_lambda, aws_lambda_nodejs, aws_stepfunctions, aws_stepfunctions_tasks } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import type { AggregationResponse } from './lambda/aggregation.js';
import { findDuplicatedFirst, getOrCreateLambdaFunction, resolveESM } from '../../lib/index.js';

export interface TesterOutput extends AggregationResponse {}

export interface TestCase {
   /**
    * Identifier of testCase. Should be unique.
    */
   id: string;
   /**
    * Steps in a single test case.
    */
   steps: {
      /**
       * If lambda throws any error thrown(like assertion error), the test case will result in FAIL.
       *
       * If lambda returns anything, it will be regarded as pass.
       * The returned payload will be passed to next step's lambda event payload
       * When all steps are passed, the test case will result in PASS.
       */
      lambdaFunction: aws_lambda.IFunction;
      /**
       * Interval before it invokes this step.
       * If not set, it will invoke immediately.
       */
      interval?: Duration;
   }[];
   /**
    * If this case is required to succeed, set true.
    * @default true
    */
   required?: boolean;
   /**
    * If you set input variables, it will pass to first step's lambda function as an event.
    */
   input?: Record<string, any>;
}

export interface TesterProps {
   /**
    * Test cases will be tested in parallel.
    * Each test case will be result in PASS or FAIL.
    */
   testCases: TestCase[];
   /**
    * Overall timeout.
    * @default no timeout.
    */
   totalTimeout?: Duration;
}

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
                  outputPath: '$.Payload',
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
                           'body.$': '$',
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
