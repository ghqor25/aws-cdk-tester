import { App } from 'aws-cdk-lib';
import { StackDescribeTestOnEvent } from '../lib/test-on-event/index.js';
import {
   StackDescribeTestOnDeploymentError,
   StackDescribeTestOnDeploymentFailed,
   StackDescribeTestOnDeploymentSucceeded,
} from '../lib/test-on-deployment/index.js';

const app = new App();
new StackDescribeTestOnDeploymentError(app, 'StackDescribeTestOnDeploymentError', {});
new StackDescribeTestOnDeploymentFailed(app, 'StackDescribeTestOnDeploymentFailed', {});
new StackDescribeTestOnDeploymentSucceeded(app, 'StackDescribeTestOnDeploymentSucceeded', {});
new StackDescribeTestOnEvent(app, 'StackDescribeTestOnEvent', {});
