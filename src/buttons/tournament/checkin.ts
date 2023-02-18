import { EmbedBuilder, ModalSubmitInteraction, resolveColor, TextChannel } from 'discord.js';
import moment from 'moment';

import { Modal } from '../../modal/modal.js';
import { getTeamByUserId } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { ButtonDeferType } from '../button.js';

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
                    title: `${tournament.name} Tournament`,
                    description: `Checkin is currently not available!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // get the user's team
            const team = await getTeamByUserId(intr.user.id, tournament.id);
            if (team === null) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `You are not registered for this tournament!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // check if the user is team captain
            if (team.teamLeaderId !== intr.user.id) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `You are not the team captain!`,
                    footer: {
                        text: 'Only the team captain can check in!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#008080'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // check if the team is already checked in
            if (team.teamStatus != 1) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `Your team is already checked in!`,
                    footer: {
                        text: 'No further action is required!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#008080'),
                });
                await InteractionUtils.send(intr, embed, true);
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
            await team.updateTeamStatus(2, formattedTeams);

            const embed = new EmbedBuilder({
                title: `${tournament.name} Tournament`,
                description: `You have successfully checked in your team \`${team.teamName}\`!`,
                footer: {
                    text: 'You will be notified when the tournament starts!',
                },
                timestamp: Date.now(),
                color: resolveColor('#008080'),
            });
            await InteractionUtils.send(intr, embed, true);

            // send info message
            await(intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send({
                content: `<:Heart:993799927434063892> | Player \`${intr.user.tag}\` has Checked-in the team \`${team.teamName}\`!`,
            });
        } catch (error) {
            sendErrorMessage(intr, error);
        }
    }
}
