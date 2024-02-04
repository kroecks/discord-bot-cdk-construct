# tk-discord-bot-construct

This repo is forked from discord-bot-cdk-construct.

This repo is a CDK construct that deploys aws resources for controlling an EC2 instance.
The ec2 instance is intended to be started and stopped bsaed on commands from the discord channel the bot is in.

The example use-case is a Palworld game server, able to be started by any user with a given role in the discord server.

# Architecture Overview

At a high level, there are 2 lambdas.
Through Secrets in AWS, we communicate the InstanceID as well as access keys and bot details for discord.

The first lambda will receive the interaction from discord. This will include the person who sent it, their roles, and the command their using. When you get that, you have 3 seconds to reply. When you reply, you can give back a message string, or you can give back a "pending" response to indicate a followup message will happen.

So the first lambda does some initial validate, using the server role id, and can reply for failure immediate or indicate that it's begun working for a successful, where it sends an invoke call into the second lambda by a reference to its arn.

The second lambda performs a call into ec2 to turn on/off the instance called out in the secret. In order to communicate with ec2, we need to also provide the access key that we create in the iam console and its secret token, which we get from secrets as well.
 

# Sample Usage


So the order of build is running "npx cdk synth" and "cdk deploy" to deploy the fleet.

In order to update the commands in discord, use the "npm run config" command or the "reset" or "list" command to clear or see the current commands. This will depend on the sercret access, so make sure to run "aws config" and have the access key set to access the secret.

# Useful commands

- `npx cdk synth`   compile the cloud formation template
- `cdk deploy`   deploy the synthesized template
- `npm run config`       send the discord api command updates
- `npm run reset`   remove all discord api commands
- `npm run list`   list all current discord api commands
