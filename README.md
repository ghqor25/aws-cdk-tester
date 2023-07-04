# AWS CDK TESTER (CDK CUSTOM CONSTRUCT)
It's Custom Construct internally using StepFunctions and test things with lambda functions.

Tester do a single test with multiple `testCase`s in parallel.

Each `testCase` execute  multiple `step`s(1 step = 1 lambda function) in sequential
(When lambda return any value, it will be passed as an event to next step's lambda). 

When lambda function throw error(like assertion error), the `testCase` is considered as `fail`.
When the `testCase`'s lambda functions are all passed(return anything), the `testCase` is considered as `pass`.

So, When more than 1 `testCase`s(with required: true) fail, the whole test considered as `FAILED`. 
Otherwise, considered as `SUCCEEDED`.

#### TESTCASE EXAMPLE
Step1. Publish Sns (In lambda, return value that should be put into Dynamodb. It will be passed to Step2's lambda function as event input)

Step2. Check if Dynamodb item has correctly put in 5 seconds.(use any assertion library in lambda.)

```
testCases: [
      {
         id: 'Test1',
         steps: [
            {
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'sns-publish'),
            },
            {
               interval: Duration.seconds(5),
               lambdaFunction: new aws_lambda_nodejs.NodejsFunction(this, 'check-dynamodb'),
            },
         ],
      },
   ],
```


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
   // number of total testCases
   total: number;
   // number of passed only testCases
   pass: number;
   // number of failed only testCases(total)
   failTotal: number;
   // number of failed only testCases(with required:true)
   failRequired: number;
   // number of failed only testCases(with required:false)
   failOptional: number;
}
```

+ For snsTopicWhenError
```
messageAttributes: {
   status: 'FAILED' | 'TIMED_OUT';
}
```