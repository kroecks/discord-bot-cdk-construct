import {AWSError} from 'aws-sdk';
import {SecretsManager} from 'aws-sdk';
import {GetSecretValueResponse} from 'aws-sdk/clients/secretsmanager';
import {discordBotAPIKeyName} from '../functions/constants/EnvironmentProps';
import {IDiscordSecrets} from "../types";
import {DiscordInteractions} from 'slash-commands';
import {getDiscordSecrets} from "../functions/utils/DiscordSecrets";
import {PartialApplicationCommand} from "slash-commands/dist/src/structures";

console.log("Starting up now!...");

const commands : PartialApplicationCommand[] = [
    {
        name: 'palserver',
        description: 'Control the Palserver. Control the Pals.',
        options: [
            {
                name: 'pal_option',
                description: '[start|stop|status]',
                type: 3,
                required: true,
            },
        ],
    },
];

const secretsManager = new SecretsManager({
    region: 'us-west-2',
});

console.log("Declarations made...");

// let secrets = await getDiscordSecrets();

console.log(`Getting secret... ${discordBotAPIKeyName}`);
secretsManager.getSecretValue({
        SecretId: discordBotAPIKeyName,
    },
    async (err?: AWSError, data?: GetSecretValueResponse) => {
        console.log(`Err=[${JSON.stringify(err)}] Data=${JSON.stringify(data)}`);

        if (data?.SecretString) {
            try {
                const discordSecrets: IDiscordSecrets = JSON.parse(data.SecretString);
                const interaction = new DiscordInteractions({
                    applicationId: discordSecrets.applicationId,
                    authToken: discordSecrets.botToken,
                    publicKey: discordSecrets.publicKey,
                });

                console.log(`Retrieved secrets: ${discordSecrets.applicationId} auth=${discordSecrets.authToken} pub=${discordSecrets.publicKey}`);

                const inputArgs = process.argv.slice(2);

                console.log(`Input Args: ${inputArgs}`);

                switch (inputArgs[0]) {
                    case 'setup':
                        commands.forEach(async (command) => {
                            await interaction.createApplicationCommand(command).then(() => {
                                console.log(`Created command ${command.name}!`);
                            }).catch(console.log);
                        });
                        break;
                    case 'list':
                        const commandList = await interaction.getApplicationCommands();

                        console.log(`Existing Commands: ${JSON.stringify(commandList)}`);

                        if (commandList) {
                            commandList.forEach(async (command) => {
                                console.log(`Existing command ${command.name}`);
                            });
                        }

                        break;
                    case 'reset':
                        const existingCommands = await interaction.getApplicationCommands();

                        console.log(`Existing Commands: ${JSON.stringify(existingCommands)}`);

                        if (existingCommands) {
                            existingCommands.forEach(async (command) => {
                                await interaction
                                    .deleteApplicationCommand(command.id)
                                    .then(() => {
                                        console.log(`Deleted command ${command.name}!`);
                                    })
                                    .catch(console.error);
                            });
                        }
                        else {
                            console.log("Existing commands is null");
                        }

                        break;
                }
            } catch (exception) {
                console.log(`There was an error parsing the secret JSON: ${exception}`);
                console.log('Please make sure that you have setup your secrets in the AWS console!');
            }
        } else {
            console.log('There was a problem retrieving your deployment results.\
    Make sure you\'ve run "npm run deploy" before running this command.');
        }
    });//.promise();

// res.then((r) => {
//     console.log("then");
// })
// .catch((r) => {
//     console.log("catch");
// })
// .finally(() => {
//     console.log("finally");
// });
