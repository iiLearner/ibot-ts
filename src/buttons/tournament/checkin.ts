import {
    ButtonInteraction,
    EmbedBuilder,
    ModalSubmitInteraction,
    TextChannel,
    resolveColor,
} from 'discord.js';
import moment from 'moment';

import { getTeamByUserId, updateTeamStatus } from '../../tournament/Team.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';
import { Button, ButtonDeferType } from '../button.js';
import { Modal } from '../../modal/modal.js';

export class CheckIn implements Modal {
    public readonly ids = ['checkin_modal_response'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);
            const registrationClose = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).subtract(2, 'hours');

            // check if checkin is not available
            if (
                moment().isBefore(registrationClose) ||
                moment().isAfter(
                    moment(tournament.tournament_time, 'DD-MM-YYYY HH:mm:ss').subtract(
                        15,
                        'minutes'
                    )
                )
            ) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `Checkin is currently not available!`,
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

            // get the user's team
            const team = await getTeamByUserId(intr.user.id, tournament.id);
            if (team === null) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `You are not registered for this tournament!`,
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

            // check if the user is team captain
            if (team.teamLeaderId !== intr.user.id) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `You are not the team captain!`,
                    footer: {
                        text: 'Only the team captain can check in!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#008080'),
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

            // check if the team is already checked in
            if (team.teamStatus != 1) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `Your team is already checked in!`,
                    footer: {
                        text: 'No further action is required!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#008080'),
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

            const teamSelections = [];
            for (let index = 0; index < tournament.mode; index++) {
                teamSelections.push(intr.fields.getTextInputValue(`team_selection_${index}`));
            }

            // convert array to json object
            let formattedTeams = '{';
            teamSelections.forEach((team, index) => {
                formattedTeams += `"Game ${index + 1}": "${team}",`;
            });

            //remove last comma
            formattedTeams = formattedTeams.slice(0, -1);
            formattedTeams += '}';

            // checkin the team
            await updateTeamStatus(team.teamId, 2, formattedTeams);

            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `You have successfully checked in your team \`${team.teamName}\`!`,
                footer: {
                    text: 'You will be notified when the tournament starts!',
                },
                timestamp: Date.now(),
                color: resolveColor('#008080'),
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

            // send info message
            await (intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send({
                content: `<:Heart:993799927434063892> | Player \`${intr.user.tag}\` has Checked-in the team \`${team.teamName}\`!`,
            });
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

    // seconds to days, hours, minutes, seconds
}
