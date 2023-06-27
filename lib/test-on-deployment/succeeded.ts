import { Duration, Stack, type StackProps, aws_lambda, aws_lambda_nodejs, aws_logs } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { resolveESM } from '../../src/lib/index.js';
import { TestOnDeployment } from 'index.js';

export interface StackDescribeTestOnDeploymentSucceededProps extends StackProps {}

export class StackDescribeTestOnDeploymentSucceeded extends Stack {
   constructor(scope: Construct, id: string, props: StackDescribeTestOnDeploymentSucceededProps) {
      super(scope, id, props);

      new TestOnDeployment(this, 'TestOnDeployment', {
         logGroup: new aws_logs.LogGroup(this, 'LogGroup'),
         testCases: [
            {
               id: 'Succeeded-test1',
               required: false,
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
   }
}
