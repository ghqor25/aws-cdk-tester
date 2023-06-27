import { App } from 'aws-cdk-lib';
import { StackDescribeTestOnDeploymentError } from '../stack/test-on-deployment/error.js';
import { StackDescribeTestOnDeploymentFailed } from '../stack/test-on-deployment/failed.js';
import { StackDescribeTestOnDeploymentSucceeded } from '../stack/test-on-deployment/succeeded.js';
import { StackDescribeTestOnEvent } from '../stack/test-on-event/index.js';

const app = new App();
new StackDescribeTestOnDeploymentError(app, 'StackDescribeTestOnDeploymentError', {});
new StackDescribeTestOnDeploymentFailed(app, 'StackDescribeTestOnDeploymentFailed', {});
new StackDescribeTestOnDeploymentSucceeded(app, 'StackDescribeTestOnDeploymentSucceeded', {});
new StackDescribeTestOnEvent(app, 'StackDescribeTestOnEvent', {});
