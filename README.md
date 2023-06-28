# AWS CDK TESTER (CDK CUSTOM CONSTRUCT)
It's Custom Construct using StepFunctions to test things.

Tester do a single test with multiple `testCase`s in parallel.

Each `testCase` execute  multiple `step`s(1 step = 1 lambda function) in sequential. 

When lambda function throw error(like assertion error), the `testCase` is considered as `fail`.
When the `testCase`'s lambda functions are all passed(return anything), the `testCase` is considered as `pass`.

So, When more than 1 `testCase`s(with required: true) fail, the whole test considered as `FAILED`. 
Otherwise, considered as `SUCCEEDED`.

It has two modes. `TestInDeployment` and `TestInEvent`.

## TestOnDeployment
`TestOnDeployment` do test in stack deployment(using custom resource).
When Tester `FAILED`, stack deployment will fail, and stack rollback will proceed.
You can use it for neccessary integration test before deployment done.

It offers optional properties, logGroup(put logs about the test result).

```
new TestOnDeployment(this, 'TestOnDeployment', {
   logGroup: new aws_logs.LogGroup(this, 'LogGroup'),
   totalTimeout: Duration.hours(1),
   testCases: [
      {
         id: 'TestOnDeployment-test1',
         required: false,
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test1-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test1-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test1-step3'),
            },
         ],
      },
      {
         id: 'TestOnDeployment-test2',
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test2-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test2-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test2-step3'),
            },
         ],
      },
      {
         id: 'TestOnDeployment-test3',
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test3-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test3-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnDeployment-test3-step3'),
            },
         ],
      },
   ],
});
```

## TestOnEvent
`TestOnEvent` do test in scheduled date(using aws_events.Schedule).
You can use it for regular tests in specific time.

It offers optional properties, logGroup(put logs about the test result), 
snsTopic(publish when test done), 
snsTopicWhenError(publish when test could not finished because of an Error(ex. TIMED_OUT)).

```
new TestOnEvent(this, 'TestOnEvent', {
   snsTopic: new aws_sns.Topic(this, 'SnsTopic'),
   snsTopicWhenError: new aws_sns.Topic(this, 'SnsTopicWhenError'),
   logGroup: new aws_logs.LogGroup(this, 'LogGroup'),
   schedule: aws_events.Schedule.rate(Duration.hours(1)),
   testCases: [
      {
         id: 'TestOnEvent-test1',
         required: false,
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test1-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test1-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test1-step3'),
            },
         ],
      },
      {
         id: 'TestOnEvent-test2',
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test2-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test2-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test2-step3'),
            },
         ],
      },
      {
         id: 'TestOnEvent-test3',
         steps: [
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test3-step1'),
            },
            {
               interval: Duration.seconds(3),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test3-step2'),
            },
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'TestOnEvent-test3-step3'),
            },
         ],
      },
   ],
});
```

You can use SNS topic subscription filter with message attributes.

+ For snsTopic
```
messageAttributes: {
   status: 'SUCCEEDED' | 'FAILED';
   total: number;
   pass: number;
   failTotal: number;
   failRequired: number;
   failOptional: number;
}
```

+ For snsTopicWhenError
```
messageAttributes: {
   status: 'FAILED' | 'TIMED_OUT';
}
```