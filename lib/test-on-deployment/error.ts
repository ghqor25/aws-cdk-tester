import { Duration, Stack, aws_lambda, aws_lambda_nodejs, aws_logs, type StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TestOnDeployment } from '../../src/test-on-deployment/construct/index.js';
import { resolveESM } from '../../src/lib/index.js';

export interface StackDescribeTestOnDeploymentErrorProps extends StackProps {}

export class StackDescribeTestOnDeploymentError extends Stack {
   constructor(scope: Construct, id: string, props: StackDescribeTestOnDeploymentErrorProps) {
      super(scope, id, props);

      new TestOnDeployment(this, 'TestOnDeployment', {
         logGroup: new aws_logs.LogGroup(this, 'LogGroup'),
         totalTimeout: Duration.seconds(1),
         testCases: [
            {
               id: 'Error-test1',
               required: false,
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
                        entry: resolveESM(import.meta, 'lambda', 'test-fail.ts'),
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
