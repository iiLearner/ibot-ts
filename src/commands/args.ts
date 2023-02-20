import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

export class Args {
    public static readonly TOURNAMENT: APIApplicationCommandBasicOption[] = [
        {
            name: 'mode',
            description: 'mode',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                {
                    name: 'solo',
                    value: 1,
                },
                {
                    name: 'duo',
                    value: 2,
                },
                {
                    name: 'trios',
                    value: 3,
                },
            ],
        },
        {
            name: 'date_time',
            description: 'Date and time (es 10-12-2023 21:00))',
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'teams_limit',
            description: 'How many teams can register',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                {
                    name: '5',
                    value: 5,
                },
                {
                    name: '10',
                    value: 10,
                },
                {
                    name: '15',
                    value: 15,
                },
                {
                    name: '20',
                    value: 20,
                },
                {
                    name: '25',
                    value: 25,
                },
                {
                    name: '30',
                    value: 30,
                },
                {
                    name: '35',
                    value: 35,
                },
                {
                    name: '40',
                    value: 40,
                },
                {
                    name: '45',
                    value: 45,
                },
                {
                    name: '50',
                    value: 50,
                },
                {
                    name: '55',
                    value: 55,
                },
                {
                    name: '60',
                    value: 60,
                },
            ],
        },
        {
            name: 'registration_offset',
            description: 'Registration offset (default: 2)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                {
                    name: '1',
                    value: 1,
                },
                {
                    name: '2',
                    value: 2,
                },
                {
                    name: '3',
                    value: 3,
                },
                {
                    name: '4',
                    value: 4,
                },
                {
                    name: '5',
                    value: 5,
                },
            ],
        },
        {
            name: 'hero_points',
            description:
                'Enable Hero points? Users will be asked their hero choice on checkin (default: false)',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
        {
            name: 'platform',
            description: 'platform (default: ALL)',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'ALL',
                    value: 'ALL',
                },
                {
                    name: 'PC',
                    value: 'PC',
                },
                {
                    name: 'XBOX',
                    value: 'XBOX',
                },
            ],
            required: false,
        },
        {
            name: 'games',
            description: 'Number of games (default: 3)',
            type: ApplicationCommandOptionType.Integer,
            required: false,
            choices: [
                {
                    name: '1',
                    value: 1,
                },
                {
                    name: '2',
                    value: 2,
                },
                {
                    name: '3',
                    value: 3,
                },
                {
                    name: '4',
                    value: 4,
                },
                {
                    name: '5',
                    value: 5,
                },
                {
                    name: '6',
                    value: 6,
                },
            ],
        },

        {
            name: 'subs',
            description: 'Subs (default: 0)',
            type: ApplicationCommandOptionType.Number,
            required: false,
            choices: [
                {
                    name: '1',
                    value: 1,
                },
                {
                    name: '2',
                    value: 2,
                },
                {
                    name: '3',
                    value: 3,
                },
            ],
        },
        {
            name: 'log_channel',
            description: 'Log channel (default: current channel))',
            type: ApplicationCommandOptionType.Channel,
            required: false,
        },
        {
            name: 'mention_role',
            description: 'Mention role (default: none)',
            type: ApplicationCommandOptionType.Role,
            required: false,
        },
        {
            name: 'streamer',
            description: 'Streamer link (default: none)',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ];
}
