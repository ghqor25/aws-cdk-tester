import type { StepFunctionsError } from '../../../../type/aws-cdk/stepfunctions/index.js';

export interface TestCasePass<T = any> {
   id: string;
   status: 'pass';
   body: T;
}
export interface TestCaseFail {
   id: string;
   stepIndex: number;
   status: 'fail';
   required: boolean;
   body: { error: string; cause: StepFunctionsError };
}

interface AggregationEvent {
   testCases: (
      | {
           id: string;
           status: 'pass';
           body: any;
        }
      | {
           id: string;
           stepIndex: number;
           status: 'fail';
           required: boolean;
           body: { Error: string; Cause: string };
        }
   )[];
}

export interface AggregationResponse {
   result: { total: number; pass: number; fail: { total: number; required: number; optional: number } };
   logs: {
      passes: TestCasePass[];
      fails: TestCaseFail[];
   };
}

export const handler = async (event: AggregationEvent): Promise<AggregationResponse> => {
   console.log(JSON.stringify(event, null, 2));

   const aggregation = event.testCases.reduce(
      (aggregation, testCase) => {
         if (testCase.status === 'pass') {
            aggregation.logs.passes.push(testCase);

            ++aggregation.result.pass;
         } else if (testCase.status === 'fail') {
            aggregation.logs.fails.push({
               id: testCase.id,
               stepIndex: testCase.stepIndex,
               status: testCase.status,
               required: testCase.required,
               body: { error: testCase.body.Error, cause: JSON.parse(testCase.body.Cause) },
            });

            if (testCase.required === true) ++aggregation.result.fail.required;
            else if (testCase.required === false) ++aggregation.result.fail.optional;
            ++aggregation.result.fail.total;
         }

         return aggregation;
      },
      {
         result: { total: event.testCases.length, pass: 0, fail: { total: 0, required: 0, optional: 0 } },
         logs: { passes: [], fails: [] },
      } as AggregationResponse,
   );

   return aggregation;
};
