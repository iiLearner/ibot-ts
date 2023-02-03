import { Message } from 'discord.js';

import { EventHandler, TriggerHandler } from './index.js';

export class MessageHandler implements EventHandler {
    constructor(private triggerHandler: TriggerHandler) {}

    public async process(msg: Message): Promise<void> {
        // Don't respond to system messages or self
        if (msg.system || msg.author.id === msg.client.user?.id) {
            return;
        }

        // wiease
        if (msg.author.id === '981073848399187978' && msg.guild?.id === '750237703739539497') {
            if (
                msg.content.toLowerCase() ==
                'liam said hi and gave you a limited role: year of rabbit!'
            ) {
                // get role
                const role = await msg.guild?.roles.fetch('1059692364324671528');
                const user = msg.mentions.repliedUser;

                // give user the role
                if (role && user) {
                    const member = await msg.guild?.members.fetch(user.id);
                    await member?.roles.add(role);
                }
            }
        }

        // Process trigger
        await this.triggerHandler.process(msg);
    }
}
