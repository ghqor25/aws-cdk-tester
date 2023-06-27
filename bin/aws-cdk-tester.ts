import { App } from 'aws-cdk-lib';
import { StackDescribeTestOnDeploymentError } from '../lib/test-on-deployment/error.js';
import { StackDescribeTestOnDeploymentFailed } from '../lib/test-on-deployment/failed.js';
import { StackDescribeTestOnDeploymentSucceeded } from '../lib/test-on-deployment/succeeded.js';
import { StackDescribeTestOnEvent } from '../lib/test-on-event/index.js';

const app = new App();
new StackDescribeTestOnDeploymentError(app, 'StackDescribeTestOnDeploymentError', {});
new StackDescribeTestOnDeploymentFailed(app, 'StackDescribeTestOnDeploymentFailed', {});
new StackDescribeTestOnDeploymentSucceeded(app, 'StackDescribeTestOnDeploymentSucceeded', {});
new StackDescribeTestOnEvent(app, 'StackDescribeTestOnEvent', {});
