import { Duration, Stack, StackProps, aws_events, aws_lambda, aws_lambda_nodejs, aws_logs } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TestOnDeployment } from '../../src/test-on-deployment/index.js';
import { resolveESM } from '../../src/lib/index.js';

export interface StackDescribeTestOnDeploymentFailedProps extends StackProps {}

export class StackDescribeTestOnDeploymentFailed extends Stack {
   constructor(scope: Construct, id: string, props: StackDescribeTestOnDeploymentFailedProps) {
      super(scope, id, props);

      new TestOnDeployment(this, 'TestOnDeployment', {
         logGroup: new aws_logs.LogGroup(this, 'LogGroup'),
         testCases: [
            {
               id: 'Failed-test1',
               required: false,
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
   }
}
