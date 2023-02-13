import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsString,
    resolveColor,
} from 'discord.js';
import moment from 'moment-timezone';

import { EventData } from '../../models/internal-models.js';
import { Tournament } from '../../tournament/Tournament.js';
import { Command, CommandDeferType } from '../index.js';
import { TextChannel } from 'discord.js';

export class TournamentCommand implements Command {
    public names = ['tournament'];
    public deferType = CommandDeferType.PUBLIC;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, _data: EventData): Promise<void> {
        let args = {
            mode: intr.options.getString('mode'),
            time: intr.options.getString('date_time'),
            streamer: intr.options.getString('streamer'),
        };

        // check permissions
        if (intr.user.id !== '266947686194741248') {
            if (intr.replied || intr.deferred) {
                await intr.followUp({
                    content: 'You do not have permission to use this command',
                    ephemeral: true,
                });
                return;
            } else {
                await intr.reply({
                    content: 'You do not have permission to use this command',
                    ephemeral: true,
                });
                return;
            }
        }

        const datetime = moment(args.time, 'DD-MM-YYYY HH:mm:ss');
        if (!datetime.isValid() || datetime.isBefore(moment())) {
            if (intr.replied || intr.deferred) {
                await intr.followUp({ content: 'Invalid date/time', ephemeral: true });
                return;
            } else {
                await intr.reply({ content: 'Invalid date/time', ephemeral: true });
                return;
            }
        }

        let embed: EmbedBuilder;

        const description = `
        **Tournament Details**\nWelcome to the weekly Naraka: Bladepoint official server tournament/scrim!\nThe tournament will consist of 3 matches in a custom room with players from all platforms, to win the tournament you must get as many points as you can in 3 games.\n\n${this.getExtraDescription(
            args.mode
        )}\n\`\`\`Please read the rules carefully as they are the most important part in this tournament!\`\`\`
        `;

        embed = new EmbedBuilder({
            title: 'Moonbane Slayers Tournament',
            description: description,
            fields: [
                {
                    name: 'Game Type',
                    value: this.getModeText(args.mode),
                    inline: true,
                },
                {
                    name: '# of Games',
                    value: '3',
                    inline: true,
                },
                {
                    name: 'Time',
                    value: datetime.format('dddd, MMMM Do YYYY, h:mm:ss a [GMT+1]'),
                    inline: false,
                },
                {
                    name: 'Registrations close',
                    value: datetime
                        .subtract(120, 'minutes')
                        .format('dddd, MMMM Do YYYY, h:mm:ss a [GMT+1]'),
                    inline: false,
                },
                {
                    name: 'Party limit',
                    value: this.getPartyLimit(args.mode),
                    inline: false,
                },
                {
                    name: 'Support',
                    value: `Contact <@${intr.member.user.id}> for any questions`,
                    inline: false,
                },
            ],
            footer: {
                text: 'Registrations close 2 hours before the tournament starts',
            },
            timestamp: Date.now(),
            color: resolveColor('#0099ff'),
        });

        if (args.streamer) {
            embed.addFields({
                name: 'Streamer',
                value: args.streamer,
                inline: false,
            });
        }

        intr.deferReply();
        const role = intr.guild.roles.cache.get('1064512125617328158');
        const content = {
            content: `${role}`,
            embeds: [embed],
            components: [this.getComponents(args.mode)],
        };

        const channel = intr.channel;
        if (channel) {
            const msg = await channel.send({
                ...content,
                allowedMentions: { roles: [role?.id], repliedUser: false },
            });

            // create a role
            const TournamentRole = await intr.guild.roles.create({
                name: `MS#${Math.floor(Math.random() * 1000)}`,
                mentionable: false,
            });

            const tournament = new Tournament(
                'Moonbane Slayers Tournament',
                intr.user.id,
                intr.guild.id,
                '1064513797492068364',
                msg.channel.id,
                msg.id,
                TournamentRole.id,
                datetime.add('120', 'minutes').format('DD-MM-YYYY HH:mm:ss'),
                Number(args.mode)
            );
            await tournament.createTournament();
            intr.deleteReply();
        }
    }

    getModeText(mode: string): string {
        switch (mode) {
            case '1':
                return 'Solo';
            case '2':
                return 'Duo';
            case '3':
                return 'Trios';
            default:
                return 'Invalid';
        }
    }

    getPartyLimit(mode: string): string {
        switch (mode) {
            case '1':
                return '30 players (30 teams of 1)';
            case '2':
                return '60 players (30 teams of 2) +1 sub';
            case '3':
                return '60 players (20 teams of 3) + 2 subs';
            default:
                return 'Invalid';
        }
    }

    getExtraDescription(mode: string): string {
        switch (mode) {
            case '1':
                return '_Press the button below to sign up for the tournament_';
            case '2':
            case '3':
                return '_Press the button below to create a team or join an existing one_';
            default:
                return 'Invalid';
        }
    }

    getComponents(mode: string): any {
        let components = {};
        switch (mode) {
            case '1':
                components = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Signup',
                            custom_id: 'sign_up_solo',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Unregister',
                            custom_id: 'sign_off',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Time Left',
                            custom_id: 'sign_up_time_left',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Teams',
                            custom_id: 'tournament_teams',
                        },
                    ],
                };
                break;
            case '2':
            case '3': {
                components = {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            style: 1,
                            label: 'Create Team',
                            custom_id: 'sign_up',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Join Team',
                            custom_id: 'sign_up_team',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Unregister',
                            custom_id: 'sign_off',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Time Left',
                            custom_id: 'sign_up_time_left',
                        },
                        {
                            type: 2,
                            style: 2,
                            label: 'Teams',
                            custom_id: 'tournament_teams',
                        },
                    ],
                };
                break;
            }
            default:
                components = {};
        }
        return components;
    }
}
