import {
    ButtonInteraction,
    EmbedBuilder,
    ModalSubmitInteraction,
    resolveColor,
    TextChannel,
} from 'discord.js';

import { ButtonDeferType } from '../../buttons/button.js';
import { getTeamByUserId } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Modal } from '../modal.js';

export class CheckIn implements Modal {
    public readonly ids = ['checkin_modal_response'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ModalSubmitInteraction | ButtonInteraction): Promise<void> {
        const messageId = intr.message.id;
        try {
            // get the user's team
            const tournament = await getTournamentByMessage(messageId);
            const team = await getTeamByUserId(intr.user.id, tournament.id);

            if (intr instanceof ModalSubmitInteraction) {
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
            } else {
                // checkin the team
                await team.updateTeamStatus(2, '{}');
            }

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
