import { EmbedBuilder, ModalSubmitInteraction, TextChannel, resolveColor } from 'discord.js';
import moment from 'moment';

import { Player } from '../../tournament/Player.js';
import { Team, getTournamentTeams, getTournamentTeams_Ex } from '../../tournament/Team.js';
import { getTournamentByMessage, updateTournamentStatus } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class StartTournamentModal implements Modal {
    ids: ['start_tournament'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);
            const registrationClose = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).subtract(2, 'hours');

            // only event host can start the tournament
            if (intr.user.id !== tournament.userid) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `Only the event host can start the tournament!`,
                    color: resolveColor('#fe0c03'),
                });

                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            if (!moment().isAfter(registrationClose)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `The registration for this tournament has not closed yet!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            // check if the tournament is already started
            if (tournament.status == 3) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `The tournament has already started!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            const roomName = intr.fields.getTextInputValue('room_name');
            const roomPass = intr.fields.getTextInputValue('room_pass');
            const tournamentEmbed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `The tournament has started!`,
                fields: [
                    {
                        name: 'Room Name',
                        value: roomName,
                    },
                    {
                        name: 'Room Password',
                        value: roomPass,
                    },
                ],
                footer: {
                    text: 'Need help? Contact a moderator!',
                },
                timestamp: Date.now(),
                color: resolveColor('#008080'),
            });

            const tournamenTeams = await getTournamentTeams_Ex(tournament.id);
            if (!tournamenTeams.length) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `There are no teams registered for this tournament!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            tournamenTeams.forEach(async team => {
                intr.guild.members.fetch(team.teamLeaderId).then(async captain => {
                    if (!captain) return;
                    captain.send({
                        embeds: [tournamentEmbed],
                    });
                });
            });

            await (intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send(
                '<:salute:805635879312818186> | The tournament has started! Room credentials have been sent to the captains!'
            );

            if (intr.replied || intr.deferred) {
                await intr.editReply({
                    embeds: [tournamentEmbed],
                });
            } else {
                await intr.reply({
                    embeds: [tournamentEmbed],
                    ephemeral: true,
                });
            }

            await updateTournamentStatus(tournament.id, 3);
        } catch (error) {
            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `An unknown error happened, please report to the dev:  ${error}`,
                footer: {
                    text: 'Need help? Contact a moderator!',
                },
                timestamp: Date.now(),
                color: resolveColor('#fe0c03'),
            });
            if (intr.replied || intr.deferred) {
                intr.editReply({
                    embeds: [embed],
                });
            } else {
                intr.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
        }
    }
}
