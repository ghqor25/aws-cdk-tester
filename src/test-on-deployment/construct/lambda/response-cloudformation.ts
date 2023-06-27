import type { CloudFormationCustomResourceFailedResponse, CloudFormationCustomResourceSuccessResponse } from 'aws-lambda';
import type { TestOnDeploymentInput, TestOnDeploymentOutput } from '../index.js';
import type { StepFunctionsError } from '../../../../type/aws-cdk/stepfunctions/index.js';

type ResponseCloudformationEvent =
   | {
        Status: 'SUCCEEDED';
        Input: TestOnDeploymentInput;
        Output: TestOnDeploymentOutput;
     }
   | {
        Status: 'FAILED' | 'TIMED_OUT';
        Input: string;
        Error?: string;
        Cause?: string;
     };

export const handler = async (event: ResponseCloudformationEvent) => {
   console.log(JSON.stringify(event, null, 2));

   if (event.Status === 'SUCCEEDED') {
      if (event.Output.status === 'SUCCEEDED') {
         await fetch(event.Input.responseUrl, {
            method: 'put',
            body: JSON.stringify({
               Status: 'SUCCESS',
               LogicalResourceId: event.Input.logicalResourceId,
               PhysicalResourceId: event.Input.physicalResourceId,
               RequestId: event.Input.requestId,
               StackId: event.Input.stackId,
            } satisfies CloudFormationCustomResourceSuccessResponse),
            headers: {
               'Content-Type': 'application/json',
            },
         });
      } else {
         await fetch(event.Input.responseUrl, {
            method: 'put',
            body: JSON.stringify({
               Status: 'FAILED',
               Reason: `[TestOnDeployment] ${event.Output.status} (${event.Output.result.pass} passed , ${event.Output.result.fail.total} failed (required: ${event.Output.result.fail.required}, optional: ${event.Output.result.fail.optional}) | ${event.Output.result.total} total)`,
               LogicalResourceId: event.Input.logicalResourceId,
               PhysicalResourceId: event.Input.physicalResourceId,
               RequestId: event.Input.requestId,
               StackId: event.Input.stackId,
            } satisfies CloudFormationCustomResourceFailedResponse),
            headers: {
               'Content-Type': 'application/json',
            },
         });
      }
   } else {
      const input = JSON.parse(event.Input) as TestOnDeploymentInput;
      const cause = event.Cause ? (JSON.parse(event.Cause) as StepFunctionsError) : undefined;

      await fetch(input.responseUrl, {
         method: 'put',
         body: JSON.stringify({
            Status: 'FAILED',
            Reason: `[TestOnDeployment] ERROR (Status: ${event.Status}, ErrorType: ${cause?.errorType}, ErrorMessage: ${cause?.errorMessage})`,
            LogicalResourceId: input.logicalResourceId,
            PhysicalResourceId: input.physicalResourceId,
            RequestId: input.requestId,
            StackId: input.stackId,
         } satisfies CloudFormationCustomResourceFailedResponse),
         headers: {
            'Content-Type': 'application/json',
         },
      });
   }
};
