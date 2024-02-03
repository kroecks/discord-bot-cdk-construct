import {Context, Callback, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {IDiscordEventRequest, IDiscordJsonBody} from '../types';
import {getDiscordSecrets} from './utils/DiscordSecrets';
import {Lambda} from 'aws-sdk';
import {commandLambdaARN} from './constants/EnvironmentProps';
import {sign} from 'tweetnacl';

import { logger } from './common/powertools';

const lambda = new Lambda();

const SERVER_ROLE = "1203108322551664690";

function isValidPlayer(event: IDiscordEventRequest) {

  if (event.jsonBody.member && event.jsonBody.member.roles.includes(SERVER_ROLE)) {
    return true;
  }

  return false;
}

/**
 * Handles incoming events from the Discord bot.
 * @param {IDiscordEventRequest} event The incoming request to handle.
 * @param {Context} context The context this request was called with.
 * @param {Callback} callback A callback to handle the request.
 * @return {IDiscordEventResponse} Returns a response to send back to Discord.
 */
export async function handler(event: IDiscordEventRequest, _context: Context,
    _callback: Callback) {
  logger.info(`Received event: ${JSON.stringify(event)}`);

  const verifyPromise = verifyEvent(event);

  if (event) {
    switch (event.jsonBody.type) {
      case 1:
        // Return pongs for pings
        if (await verifyPromise) {
          return {
            type: 1,
          };
        }
        break;
      case 2:
        var eventPayload = JSON.stringify({
          ...event,
          // Hacky workaround due to https://github.com/aws/jsii/issues/3468
          guildId: (event.jsonBody.data as any)?['guild_id'] : undefined,
          targetId: (event.jsonBody.data as any)?['target_id'] : undefined,
        });

        if (!isValidPlayer(event)) {
          logger.info("Non-valid player calling!");
          return {
            type: 4,
            data: {
              content: `You're not a Pal Trainer, ${(event.jsonBody.member ? event.jsonBody.member.user.global_name : "INSERT_PEASANT_NAME")}`
            }
          }
        }

        logger.info(`Attempting to call command lambda! ARN=${commandLambdaARN} Payload=${eventPayload}`);
        // Invoke the lambda to respond to the deferred message.
        const lambdaPromise = lambda.invoke({
          FunctionName: commandLambdaARN,
          Payload: eventPayload,
          InvocationType: 'Event',
        }).promise();

        // Call of the promises and ACK the interaction.
        // Note that all responses are deferred to meet Discord's 3 second
        // response time requirement.
        if (await Promise.all([verifyPromise, lambdaPromise])) {
          lambdaPromise.then(result => {
            logger.info(`Lambda result: ${JSON.stringify(result)}`);
            return result;
          })
          // return {
          //   type: 4,
          //   data: {
          //     content: `Hey there, ${(event.jsonBody.member ? event.jsonBody.member.user.global_name : "INSERT_PEASANT_NAME")}`
          //   }
          //
          // }
          return {
            type: 5,
          };
        }

        logger.error(`We shouldn't make it here, right?`);

        break;
    }
  }

  throw new Error('[UNAUTHORIZED] invalid request signature');
}

/**
 * Verifies that an event coming from Discord is legitimate.
 * @param {IDiscordEventRequest} event The event to verify from Discord.
 * @return {boolean} Returns true if the event was verified, false otherwise.
 */
export async function verifyEvent(event: IDiscordEventRequest): Promise<boolean> {
  try {
    const discordSecrets = await getDiscordSecrets();
    const isVerified = sign.detached.verify(
        Buffer.from(event.timestamp + JSON.stringify(event.jsonBody)),
        Buffer.from(event.signature, 'hex'),
        Buffer.from(discordSecrets?.publicKey ?? '', 'hex'),
    );
    return isVerified;
  } catch (exception) {
    console.log(exception);
    return false;
  }
}
