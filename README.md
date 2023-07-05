# AWS CDK TESTER (CDK CUSTOM CONSTRUCT)
It's Custom Construct internally using StepFunctions and it's for test things with lambda functions.

Tester execute multiple `testCase`s in parallel at once. \
Each `testCase` has  multiple `step`s(1 step = 1 lambda function) in sequential \
(When lambda return any value, it will be passed as `event.body` to next step's lambda). 

When lambda function throws error, the `testCase` is considered as `fail`. \
When the `testCase`'s steps are all passed(do not throw any error), the `testCase` is considered as `pass`.

So, When 1 or more `testCase`(with required: true) got `fail`, the whole test considered as `FAILED`. \
Otherwise, It will be considered as `SUCCEEDED`.

### TESTCASE EXAMPLE
Step1. Publish Sns (In lambda, return expected value that should be put into Dynamodb. It will be passed to Step2's lambda function as `event.body`.) \
Step2. Check if Dynamodb item has correctly put within 5 seconds.(use any assertion library in lambda.)

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
`TestOnDeployment` do test in stack deployment(Internally using stepfunctions, lambdas, custom-resource). \
When the test has `FAILED`, stack deployment will be failed, and the stack will be rollbacked. \
You can use it for neccessary integration test during stack deployment.

It offers optional properties, logGroup(Log test result automatically in each test).

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
`TestOnEvent` do test in scheduled date(Internally using stepfunctions, lambdas, eventbridge scheduler, custom-resource). \
You can use it for regular tests in specific time.

It offers optional properties, logGroup(Log test result automatically in each test), \
snsTopic(Publish when test done), \
snsTopicWhenError(Publish when test could not finished because of an error(ex. TIMED_OUT)).

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