import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

export class Args {
    public static readonly TOURNAMENT: APIApplicationCommandBasicOption[] = [
        {
            name: 'mode',
            description: 'mode',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'solo',
                    value: '1',
                },
                {
                    name: 'duo',
                    value: '2',
                },
                {
                    name: 'trios',
                    value: '3',
                },
            ],
        },
        {
            name: 'date_time',
            description: 'Date and time',
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'streamer',
            description: 'Streamer link',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ];
}
