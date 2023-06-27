import { Stack, aws_lambda_nodejs } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export const getOrCreateLambdaFunction = (
   scope: Construct,
   globalUniqueId: string,
   props: aws_lambda_nodejs.NodejsFunctionProps,
): aws_lambda_nodejs.NodejsFunction => {
   const stack = Stack.of(scope);
   const existingLambdaFunction = stack.node.tryFindChild(globalUniqueId);

   if (existingLambdaFunction) return existingLambdaFunction as aws_lambda_nodejs.NodejsFunction;
   else return new aws_lambda_nodejs.NodejsFunction(stack, globalUniqueId, props);
};
