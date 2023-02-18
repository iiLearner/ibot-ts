import { EmbedBuilder, ModalSubmitInteraction, resolveColor, TextChannel } from 'discord.js';

import { getTournamentTeams_Ex } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Modal } from '../index.js';

export class StartTournamentModal implements Modal {
    ids: ['start_tournament'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);

            // only event host can start the tournament
            if (intr.user.id !== tournament.userid) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `Only the event host can start the tournament!`,
                    color: resolveColor('#fe0c03'),
                });

                await InteractionUtils.send(intr, embed, true);
                return;
            }

            if (!tournament.isTournamentClosed()) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `The registration for this tournament has not closed yet!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // check if the tournament is already started
            if (tournament.status == 3) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `The tournament has already started!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                await InteractionUtils.send(intr, embed, true);
                return;
            }

            const roomName = intr.fields.getTextInputValue('room_name');
            const roomPass = intr.fields.getTextInputValue('room_pass');
            const tournamentEmbed = new EmbedBuilder({
                title: `${tournament.name} Tournament`,
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

            const tournamentTeams = await getTournamentTeams_Ex(tournament.id);
            if (!tournamentTeams.length) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `There are no teams registered for this tournament!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                await InteractionUtils.send(intr, embed, true);
                return;
            }

            tournamentTeams.forEach(async team => {
                intr.guild.members.fetch(team.teamLeaderId).then(async captain => {
                    if (!captain) return;
                    captain.send({
                        embeds: [tournamentEmbed],
                    });
                });
            });

            await(intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send(
                '<:salute:805635879312818186> | The tournament has started! Room credentials have been sent to the captains!'
            );

            await InteractionUtils.send(intr, tournamentEmbed, true);

            await tournament.updateTournamentStatus(3);
        } catch (error) {
            sendErrorMessage(error, intr);
        }
    }
}
