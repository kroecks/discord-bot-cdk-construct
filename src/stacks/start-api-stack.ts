import {Duration, Stack} from 'aws-cdk-lib';
import {LayerVersion, Runtime} from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import {DiscordBotConstruct} from '../constructs/DiscordBotConstruct';
import {Construct} from 'constructs';
import * as path from 'path';

/**
 * Creates a sample Discord bot endpoint that can be used.
 */
export class SampleDiscordBotStack extends Stack {
  /**
   * The constructor for building the stack.
   * @param {Construct} scope The Construct scope to create the stack in.
   * @param {string} id The ID of the stack to use.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create the Commands Lambda.
    const discordCommandsLambda = new NodejsFunction(this, 'discord-commands-lambda', {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../functions/DiscordCommands.ts'),
      handler: 'handler',
      timeout: Duration.seconds(60),
      bundling: {
        externalModules: [
          '@aws-lambda-powertools/commons',
          '@aws-lambda-powertools/logger',
          '@aws-lambda-powertools/tracer',
          '@aws-lambda-powertools/metrics',
          '@aws-lambda-powertools/parameters',
        ],
      },
      layers: [LayerVersion.fromLayerVersionArn(
        this,
        'powertools-layer',
        `arn:aws:lambda:${
          Stack.of(this).region
        }:094274105915:layer:AWSLambdaPowertoolsTypeScript:27`
      )]
    });

    // @ts-ignore
    const discordBot = new DiscordBotConstruct(this, 'discord-bot-endpoint', {
      commandsLambdaFunction: discordCommandsLambda,
    });
  }
}
