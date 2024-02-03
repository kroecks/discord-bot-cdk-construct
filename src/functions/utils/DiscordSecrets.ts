import {SecretsManager} from 'aws-sdk';
import {IDiscordSecrets} from '../../types';
import {discordBotAPIKeyName} from '../constants/EnvironmentProps';

import { logger } from '../common/powertools';

const secretsManager = new SecretsManager();

/**
 * Cached Discord secrets so we can reduce warm start times.
 */
let __discordSecrets: IDiscordSecrets | undefined = undefined;

/**
 * Gets the Discord secrets (public key, client ID, etc.) for use in our lambdas.
 *
 * @return {Promise<IDiscordSecrets | undefined>} The Discord secrets to be used.
 */
export async function getDiscordSecrets(): Promise<IDiscordSecrets | undefined> {
  if (!__discordSecrets) {
    try {
      logger.info(`Trying to read secret ${discordBotAPIKeyName}`);

      const discordApiKeys = await secretsManager.getSecretValue({
        SecretId: discordBotAPIKeyName,
      }).promise();
      if (discordApiKeys.SecretString) {
        logger.info(`Trying to read secret ${discordBotAPIKeyName} string as json: ${discordApiKeys.SecretString}`)
        __discordSecrets = JSON.parse(discordApiKeys.SecretString);
      }
    } catch (exception) {
      logger.error(`Unable to get Discord secrets: ${exception}`);
    }
  }
  return __discordSecrets;
};
