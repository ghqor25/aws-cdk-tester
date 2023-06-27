import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import type { TestOnDeploymentInput } from '../index.js';
import type { CloudFormationCustomResourceEvent, CloudFormationCustomResourceSuccessResponse } from 'aws-lambda';

const stateMachineArn = process.env.STATE_MACHINE_ARN as string;

const stepfunctionClient = new SFNClient({});

export const handler = async (event: CloudFormationCustomResourceEvent) => {
   console.log(JSON.stringify(event, null, 2));

   if (event.ResourceProperties.enabled === 'true') {
      if (event.RequestType === 'Create' || event.RequestType === 'Update') {
         await stepfunctionClient.send(
            new StartExecutionCommand({
               stateMachineArn,
               input: JSON.stringify({
                  logicalResourceId: event.LogicalResourceId,
                  physicalResourceId: event.RequestType === 'Update' ? event.PhysicalResourceId : `${event.StackId}-${event.RequestId}`,
                  requestId: event.RequestId,
                  stackId: event.StackId,
                  responseUrl: event.ResponseURL,
               } satisfies TestOnDeploymentInput),
            }),
         );
      } else if (event.RequestType === 'Delete') {
         await fetch(event.ResponseURL, {
            method: 'put',
            body: JSON.stringify({
               Status: 'SUCCESS',
               LogicalResourceId: event.LogicalResourceId,
               PhysicalResourceId: event.PhysicalResourceId,
               RequestId: event.RequestId,
               StackId: event.StackId,
            } satisfies CloudFormationCustomResourceSuccessResponse),
            headers: { 'Content-Type': 'application/json' },
         });
      } else throw new Error(`wrong request type. event: ${event}`);
   } else if (event.ResourceProperties.enabled === 'false') {
      await fetch(event.ResponseURL, {
         method: 'put',
         body: JSON.stringify({
            Status: 'SUCCESS',
            LogicalResourceId: event.LogicalResourceId,
            PhysicalResourceId: event.RequestType === 'Update' ? event.PhysicalResourceId : `${event.StackId}-${event.RequestId}`,
            RequestId: event.RequestId,
            StackId: event.StackId,
         } satisfies CloudFormationCustomResourceSuccessResponse),
         headers: { 'Content-Type': 'application/json' },
      });
   } else throw new Error(`wrong property enabled value. value: ${event.ResourceProperties.enabled}`);
};
