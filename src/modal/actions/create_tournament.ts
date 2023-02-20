import { EmbedBuilder, Message, ModalSubmitInteraction, resolveColor } from 'discord.js';
import moment from 'moment';

import { sendErrorMessage, Tournament } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { PendingTournys } from '../../utils/pending-tourneys.js';
import { Modal } from '../index.js';

export class CreateTournament implements Modal {
    ids: ['create_tournament'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        try {
            intr.deferReply({ ephemeral: true });
            const pendingTourneys = new PendingTournys();
            const tournament = pendingTourneys.getTournament(intr.user.id) as unknown as any;
            const description = intr.fields.getTextInputValue('tournament_create_description');
            const title = intr.fields.getTextInputValue('tournament_create_name');

            if (!tournament) {
                const embed = new EmbedBuilder({
                    title: `Tournament`,
                    description: `Your request has expired, please try again!`,
                    color: resolveColor('#fe0c03'),
                });

                await InteractionUtils.send(intr, embed, true);
                return;
            }

            const datetime = moment(tournament.time, 'DD-MM-YYYY HH:mm:ss');
            const closeTime = moment(tournament.time, 'DD-MM-YYYY HH:mm:ss').subtract(
                tournament.registration_offset,
                'hours'
            );
            const embed = new EmbedBuilder({
                title: `${title}`,
                description: `${description}\n${this.getExtraDescription(tournament.mode)}}`,
                fields: [
                    {
                        name: 'Game Type',
                        value: this.getModeText(tournament.mode),
                        inline: true,
                    },
                    {
                        name: '# of Games',
                        value: tournament.games,
                        inline: true,
                    },
                    {
                        name: 'Tournament Time',
                        value: `<t:${datetime.unix()}:F>`,
                        inline: false,
                    },
                    {
                        name: 'Registrations close',
                        value: `<t:${closeTime.unix()}:F>`,
                        inline: false,
                    },
                    {
                        name: 'Party limit',
                        value: this.getPartyLimit(
                            tournament.mode,
                            tournament.teams_limit,
                            tournament.subs
                        ),
                        inline: false,
                    },
                    {
                        name: 'Support',
                        value: `Contact <@${intr.member.user.id}> for any questions`,
                        inline: false,
                    },
                ],
                footer: {
                    text: `Registrations close ${tournament.registration_offset} hours before the tournament starts`,
                },
                timestamp: Date.now(),
                color: resolveColor('#0099ff'),
            });

            if (tournament.streamer) {
                embed.addFields({
                    name: 'Streamer',
                    value: tournament.streamer,
                    inline: false,
                });
            }
            const role = intr.guild.roles.cache.get(tournament.mention_role);
            const content = {
                content: ``,
                embeds: [embed],
                components: [this.getComponents(tournament.mode)],
            };
            if (role) content.content = `${role}`;

            // create an embed for actions
            const actionEmbed = new EmbedBuilder({
                title: `${title}`,
                description: `Use the buttons below to manage the tournament`,
            });

            const actionContent = {
                content: ``,
                embeds: [actionEmbed],
                components: [this.getActionComponents()],
            };

            // fetch user
            let actionMsg: any;
            const user = await intr.client.users.fetch(intr.user.id);
            try {
                actionMsg = await user.send(actionContent);
            } catch (error) {
                console.log(error);
                return await sendErrorMessage(intr, 'Unable to send you a DM for the tournament');
            }

            const channel = intr.channel;
            if (channel) {
                const msg = await channel.send({
                    ...content,
                    allowedMentions: { roles: [role?.id], repliedUser: false },
                });

                // create a role
                const TournamentRole = await intr.guild.roles.create({
                    name: `${title.substring(0, 30)}`,
                    mentionable: false,
                });

                const tourney = new Tournament(
                    title,
                    intr.user.id,
                    intr.guild.id,
                    tournament.log_channel,
                    msg.channel.id,
                    msg.id,
                    actionMsg.id,
                    TournamentRole.id,
                    datetime.format('DD-MM-YYYY HH:mm:ss'),
                    Number(tournament.mode),
                    tournament.platform,
                    tournament.subs,
                    tournament.teams_limit,
                    tournament.registration_offset,
                    tournament.games,
                    tournament.streamer
                );

                const username = intr.member.user.username;
                const servername = intr.guild.name;
                await tourney.createTournament(servername, username);
                intr.deleteReply();
            }
        } catch (error) {
            sendErrorMessage(intr, error);
        }
    }
    getModeText(mode: number): string {
        switch (mode) {
            case 1:
                return 'Solo';
            case 2:
                return 'Duo';
            case 3:
                return 'Trios';
            default:
                return 'Invalid';
        }
    }

    getPartyLimit(mode: string, party_limit: number, subs: number): string {
        return `${
            party_limit * Number(mode)
        } players (${party_limit} teams of ${mode} + ${subs} subs)`;
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

    getActionComponents(): any {
        return {
            type: 1,
            components: [
                {
                    type: 2,
                    style: 1,
                    label: 'Start Tournament',
                    custom_id: 'start_tournament',
                },

                {
                    type: 2,
                    style: 2,
                    label: 'Toggle Registrations',
                    custom_id: 'close_registrations',
                },
                {
                    type: 2,
                    style: 2,
                    label: 'Change Time',
                    custom_id: 'change_time',
                },
                {
                    type: 2,
                    style: 2,
                    label: 'Change Party Limit',
                    custom_id: 'change_party_limit',
                },
                {
                    type: 2,
                    style: 4,
                    label: 'Delete Tournament',
                    custom_id: 'cancel_tournament',
                },
            ],
        };
    }

    getComponents(mode: number): any {
        let components = {};
        switch (mode) {
            case 1:
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
            case 2:
            case 3: {
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
