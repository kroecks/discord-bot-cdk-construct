import {Context, Callback, APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {IDiscordEndpointInfo, IDiscordEventRequest, IDiscordResponseData, IDiscordSecrets, IPalServerDetails} from '../types';
import {discordBotAPIKeyName} from './constants/EnvironmentProps';

import {logger} from './common/powertools';
import {EC2, SecretsManager} from "aws-sdk";
import axios from "axios";

export async function handler(event: IDiscordEventRequest, context: Context, callback: Callback): Promise<string> {
  logger.info(`On COMMAND! event=${JSON.stringify(event)}`);

  const secretsManager = new SecretsManager();
  var asyncGet = secretsManager.getSecretValue({
      SecretId: discordBotAPIKeyName,
    }).promise()

  logger.info(`On Promise! ${asyncGet}`);

  asyncGet
      .then((data) => {
        logger.info(`Got secrets successful! ${JSON.stringify(data)}`);
      })
      .catch((res) => {
        logger.error(`Failed to get secrets: ${res}`);
      })
      .finally(() => {
        logger.info(`Finally!`);
      });

    try {
        let discordSecret = await asyncGet;
        if (discordSecret && discordSecret.SecretString) {
            logger.info(`On Result! ${discordSecret.SecretString}`);

            let secrets:IDiscordSecrets = JSON.parse(discordSecret.SecretString);

            logger.info(`On Secret parse! ${secrets}`);

            const endpointInfo = {
                botToken: secrets?.authToken,
                applicationId: secrets?.applicationId,
                apiVersion: undefined
            };

            let actionName:string = "none";

            if (event.jsonBody.data?.options) {
                let actionOption = event.jsonBody.data?.options[0];
                if (actionOption && actionOption.name && actionOption.name == "pal_option") {
                    actionName = actionOption.value?.toString() ?? "none";
                }
            }

            if (actionName == "none") {
                const response:IDiscordResponseData = {
                    tts: false,
                    content: event.jsonBody.member ? `Hey ${event.jsonBody.member.user.global_name}, I'm not sure wtf you want` : "Who are you?",
                    embeds: [],
                    allowedMentions: {
                        users: [],
                        parse: [],
                        roles: []
                    },
                };
                if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                    logger.info('Responded successfully!');
                } else {
                    logger.info('Failed to send response!');
                }
            } else {
                const response:IDiscordResponseData = {
                    tts: false,
                    content: event.jsonBody.member ? `Performing ${event.jsonBody.member.user.global_name}'s ${actionName} request` : "Who are you?",
                    embeds: [],
                    allowedMentions: {
                        users: [],
                        parse: [],
                        roles: []
                    },
                };
                if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                    logger.info('Responded successfully!');
                } else {
                    logger.info('Failed to send response!');
                }

                await secretsManager.getSecretValue({SecretId:"palserver-details"}, async function(pe, pd) {
                        if (pd && pd.SecretString) {
                            let ec2Details:IPalServerDetails = JSON.parse(pd.SecretString);
                            const ec2 = new EC2({
                                region: 'us-west-2',
                                credentials: {
                                    accessKeyId: ec2Details.accessKey,
                                    secretAccessKey: ec2Details.secretKey
                                }
                            });

                            const params = {
                                InstanceIds: [ec2Details.instanceId]
                            }

                            switch(actionName) {
                                case "start":{
                                    await ec2.startInstances(params, async function(err2, data2) {
                                        if (data2) {
                                            logger.info(`data2! ${JSON.stringify(data2)}`);

                                            const response:IDiscordResponseData = {
                                                tts: false,
                                                content: event.jsonBody.member ? `Starting server for ${event.jsonBody.member.user.global_name}'s ${actionName} request` : "Who are you?",
                                                embeds: [],
                                                allowedMentions: {
                                                    users: [],
                                                    parse: [],
                                                    roles: []
                                                },
                                            };
                                            if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                                                logger.info('Responded successfully!');
                                            } else {
                                                logger.info('Failed to send response!');
                                            }
                                        }
                                        if (err2) {
                                            logger.error(`error2! ${JSON.stringify(err2)}`);
                                        }
                                    }).promise();
                                    break;
                                }
                                case "stop": {
                                    await ec2.stopInstances(params, async function(err2, data2) {
                                        if (data2) {
                                            logger.info(`data2! ${JSON.stringify(data2)}`);

                                            const response:IDiscordResponseData = {
                                                tts: false,
                                                content: event.jsonBody.member ? `Stopping server for ${event.jsonBody.member.user.global_name}'s ${actionName} request` : "Who are you?",
                                                embeds: [],
                                                allowedMentions: {
                                                    users: [],
                                                    parse: [],
                                                    roles: []
                                                },
                                            };
                                            if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                                                logger.info('Responded successfully!');
                                            } else {
                                                logger.info('Failed to send response!');
                                            }
                                        }
                                        if (err2) {
                                            logger.error(`error2! ${JSON.stringify(err2)}`);
                                        }
                                    }).promise();
                                    break;
                                }
                                case "status": {
                                    await ec2.describeInstances(params, async function(err2, data2) {
                                        if (data2) {
                                            logger.info(`data2! ${JSON.stringify(data2)}`);

                                            const response:IDiscordResponseData = {
                                                tts: false,
                                                content: event.jsonBody.member ? `Status ${event.jsonBody.member.user.global_name}'s ${actionName} request` : "Who are you?",
                                                embeds: [],
                                                allowedMentions: {
                                                    users: [],
                                                    parse: [],
                                                    roles: []
                                                },
                                            };
                                            if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                                                logger.info('Responded successfully!');
                                            } else {
                                                logger.info('Failed to send response!');
                                            }
                                        }
                                        if (err2) {
                                            logger.error(`error2! ${JSON.stringify(err2)}`);

                                            const response:IDiscordResponseData = {
                                                tts: false,
                                                content: event.jsonBody.member ? `Failed ${event.jsonBody.member.user.global_name}'s ${actionName} request` : "Who are you?",
                                                embeds: [],
                                                allowedMentions: {
                                                    users: [],
                                                    parse: [],
                                                    roles: []
                                                },
                                            };
                                            if (event.jsonBody.token && await sendFollowupMessage(endpointInfo, event.jsonBody.token, response)) {
                                                logger.info('Responded successfully!');
                                            } else {
                                                logger.info('Failed to send response!');
                                            }
                                        }
                                    }).promise();
                                    break;
                                }
                            }
                        }

                    if (pe) {
                        logger.error(`Failed to get secrets for palserver! ${JSON.stringify(pe)}`);
                    }
                }
                ).promise();
            }
        }
    }
    catch (e) {
        logger.error(`failed to send followup! ${e}`);
    }
  return "200";
}

export async function sendFollowupMessage(endpointInfo: IDiscordEndpointInfo,
                                          interactionToken: string, responseData: IDiscordResponseData): Promise<boolean> {
    const {allowedMentions, ...strippedResponseData} = responseData;
    const authConfig = {
        headers: {
            'Authorization': `Bot ${endpointInfo.botToken}`,
        },
    };
    const data = {
        ...strippedResponseData,
        allowed_mentions: allowedMentions,
    };

    try {
        const url = `https://discord.com/api/v${
            endpointInfo.apiVersion ?? '10'
        }/webhooks/${endpointInfo.applicationId}/${interactionToken}`;
        logger.info(`SendingResponse DEBUG to url=${url}`);
        return (await axios.post(url, data, authConfig)).status == 200;
    } catch (exception) {
        console.log(`There was an error posting a response: ${exception}`);
        return false;
    }
}
