import {
    ApplicationCommandType,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import { Args } from './index.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    ADDUSER: {
        type: ApplicationCommandType.ChatInput,
        name: 'tournament',
        name_localizations: { 'en-US': 'tournament' },
        description: 'Create a tournament',
        description_localizations: { 'en-US': 'Create a tournament' },
        dm_permission: true,
        default_member_permissions: undefined,
        options: Args.TOURNAMENT.map(arg => {
            return {
                ...arg,
                required: arg.required !== undefined ? arg.required : true,
            };
        }),
    },
};