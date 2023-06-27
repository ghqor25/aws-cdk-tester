import { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { randomBytes } from 'crypto';
import type { TestOnDeploymentOutput } from '../index.js';
import type { StepFunctionsError } from '../../../lib/index.js';

type CreateLogEvent =
   | {
        Status: 'SUCCEEDED';
        Output: TestOnDeploymentOutput;
        StartDate: number;
        StopDate: number;
     }
   | {
        Status: 'FAILED' | 'TIMED_OUT';
        StartDate: number;
        StopDate: number;
        Error?: string;
        Cause?: string;
     };

const logGroupName = process.env.LOG_GROUP_NAME as string;

const cloudWatchLogsClient = new CloudWatchLogsClient({});

export const handler = async (event: CreateLogEvent) => {
   console.log(JSON.stringify(event, null, 2));

   const currentDate = new Date();
   const logStreamName = `${currentDate.getUTCFullYear()}/${currentDate.getUTCMonth()}/${currentDate.getUTCDate()}/${randomBytes(10).toString('hex')}`;

   await cloudWatchLogsClient.send(
      new CreateLogStreamCommand({
         logGroupName,
         logStreamName: logStreamName,
      }),
   );

   if (event.Status === 'SUCCEEDED') {
      await cloudWatchLogsClient.send(
         new PutLogEventsCommand({
            logGroupName,
            logStreamName: logStreamName,
            logEvents: [
               {
                  message: `[TestOnDeployment] ${event.Output.status}`,
                  timestamp: currentDate.getTime(),
               },
               {
                  message: `Start: ${new Date(event.StartDate).toISOString()}, End: ${new Date(event.StopDate).toISOString()}`,
                  timestamp: currentDate.getTime(),
               },
               {
                  message: `${event.Output.result.pass} passed , ${event.Output.result.fail.total} failed (required: ${event.Output.result.fail.required}, optional: ${event.Output.result.fail.optional}) |  ${event.Output.result.total} total`,
                  timestamp: currentDate.getTime(),
               },
               {
                  message: event.Output.logs.passes.length > 0 ? event.Output.logs.passes.map(pass => `PASSED | ${pass.id}`).join('\n') : '\n',
                  timestamp: currentDate.getTime(),
               },
               ...event.Output.logs.fails.map(fail => ({
                  message: [`FAILED | ${fail.id} (step ${fail.stepIndex + 1})`, ...fail.body.cause.trace].join('\n'),
                  timestamp: currentDate.getTime(),
               })),
            ],
         }),
      );
   } else {
      const cause = event.Cause ? (JSON.parse(event.Cause) as StepFunctionsError) : undefined;

      await cloudWatchLogsClient.send(
         new PutLogEventsCommand({
            logGroupName,
            logStreamName: logStreamName,
            logEvents: [
               {
                  message: `[TestOnDeployment] ERROR (Status: ${event.Status}, Error: ${event.Error})`,
                  timestamp: currentDate.getTime(),
               },
               {
                  message: `Start: ${new Date(event.StartDate).toISOString()}, End: ${new Date(event.StopDate).toISOString()}`,
                  timestamp: currentDate.getTime(),
               },
               {
                  message: cause ? cause.trace.join('\n') : '\n',
                  timestamp: currentDate.getTime(),
               },
            ],
         }),
      );
   }
};
