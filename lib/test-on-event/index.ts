import { Duration, Stack, type StackProps, aws_events, aws_lambda, aws_lambda_nodejs, aws_logs, aws_sns, aws_sns_subscriptions } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { resolveESM } from '../../src/lib/index.js';
import { TestOnEvent } from '../../src/test-on-event/index.js';

export interface StackDescribeTestOnEventProps extends StackProps {}

export class StackDescribeTestOnEvent extends Stack {
   constructor(scope: Construct, id: string, props: StackDescribeTestOnEventProps) {
      super(scope, id, props);

      const snsTopicSucceeded = new aws_sns.Topic(this, 'SnsTopicSucceeded');
      const snsTopicWhenError = new aws_sns.Topic(this, 'snsTopicWhenError');

      snsTopicSucceeded.addSubscription(
         new aws_sns_subscriptions.LambdaSubscription(
            new aws_lambda_nodejs.NodejsFunction(this, 'snsTopicSucceededStatus-Lambda', {
               entry: resolveESM(import.meta, 'lambda', 'test-success'),
               runtime: aws_lambda.Runtime.NODEJS_18_X,
               bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            }),
            {
               filterPolicy: {
                  status: aws_sns.SubscriptionFilter.stringFilter({ allowlist: ['SUCCEEDED'] }),
               },
            },
         ),
      );

      snsTopicSucceeded.addSubscription(
         new aws_sns_subscriptions.LambdaSubscription(
            new aws_lambda_nodejs.NodejsFunction(this, 'snsTopicSucceededResult-Lambda', {
               entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
               runtime: aws_lambda.Runtime.NODEJS_18_X,
               bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            }),
            {
               filterPolicy: {
                  failRequired: aws_sns.SubscriptionFilter.numericFilter({ allowlist: [0] }),
               },
            },
         ),
      );

      // 1. succeeded case
      new TestOnEvent(this, 'Succeeded', {
         snsTopic: snsTopicSucceeded,
         snsTopicWhenError: snsTopicWhenError,
         logGroup: new aws_logs.LogGroup(this, 'Succeeded-LogGroup'),
         schedule: aws_events.Schedule.rate(Duration.hours(1)),
         testCases: [
            {
               id: 'Succeeded-test1',
               required: false,
               input: { test1: 'hello', testarn: snsTopicWhenError.topicArn },
               steps: [
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test1-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test1-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test1-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-fail.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Succeeded-test2',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test2-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test2-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test2-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Succeeded-test3',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test3-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test3-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Succeeded-test3-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
         ],
      });

      const snsTopicFailed = new aws_sns.Topic(this, 'snsTopicFailed');
      snsTopicFailed.addSubscription(
         new aws_sns_subscriptions.LambdaSubscription(
            new aws_lambda_nodejs.NodejsFunction(this, 'snsTopicFailedStatus-Lambda', {
               entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
               runtime: aws_lambda.Runtime.NODEJS_18_X,
               bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            }),
            {
               filterPolicy: {
                  status: aws_sns.SubscriptionFilter.stringFilter({ allowlist: ['FAILED'] }),
               },
            },
         ),
      );
      snsTopicFailed.addSubscription(
         new aws_sns_subscriptions.LambdaSubscription(
            new aws_lambda_nodejs.NodejsFunction(this, 'snsTopicFailedResult-Lambda', {
               entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
               runtime: aws_lambda.Runtime.NODEJS_18_X,
               bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            }),
            {
               filterPolicy: {
                  failRequired: aws_sns.SubscriptionFilter.numericFilter({ greaterThan: 0 }),
               },
            },
         ),
      );
      // 2. failed case
      new TestOnEvent(this, 'Failed', {
         snsTopic: snsTopicFailed,
         snsTopicWhenError: snsTopicWhenError,
         logGroup: new aws_logs.LogGroup(this, 'Failed-LogGroup'),
         schedule: aws_events.Schedule.rate(Duration.hours(1)),
         testCases: [
            {
               id: 'Failed-test1',
               required: false,
               input: { test2: 'hello' },
               steps: [
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test1-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test1-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test1-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-fail.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Failed-test2',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test2-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test2-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test2-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-fail.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Failed-test3',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test3-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test3-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Failed-test3-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
         ],
      });

      snsTopicWhenError.addSubscription(
         new aws_sns_subscriptions.LambdaSubscription(
            new aws_lambda_nodejs.NodejsFunction(this, 'snsTopicWhenError-Lambda', {
               entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
               runtime: aws_lambda.Runtime.NODEJS_18_X,
               bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
            }),
         ),
      );
      // 3. operation failed case
      new TestOnEvent(this, 'Error', {
         snsTopic: snsTopicSucceeded,
         snsTopicWhenError: snsTopicWhenError,
         logGroup: new aws_logs.LogGroup(this, 'Error-LogGroup'),
         totalTimeout: Duration.seconds(1),
         schedule: aws_events.Schedule.rate(Duration.hours(1)),
         testCases: [
            {
               id: 'Error-test1',
               required: false,
               input: { test3: 'hello' },
               steps: [
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test1-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test1-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test1-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-fail.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Error-test2',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test2-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test2-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test2-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
            {
               id: 'Error-test3',
               steps: [
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test3-step1', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test3-step2', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
                  {
                     interval: Duration.seconds(3),
                     lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'Error-test3-step3', {
                        entry: resolveESM(import.meta, 'lambda', 'test-success.ts'),
                        runtime: aws_lambda.Runtime.NODEJS_18_X,
                        bundling: { format: aws_lambda_nodejs.OutputFormat.ESM, minify: true, target: 'es2022' },
                     }),
                  },
               ],
            },
         ],
      });
   }
}
