import { App } from 'aws-cdk-lib';
import { SampleDiscordBotStack } from './stacks/start-api-stack';

const app = new App();
// @ts-ignore
const startAPIStack = new SampleDiscordBotStack(app, 'StartAPIStack');
