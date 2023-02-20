import {
    ActionRowBuilder,
    ButtonInteraction,
    EmbedBuilder,
    ModalBuilder,
    resolveColor,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import moment from 'moment';

import { CheckIn } from '../../modal/checkin/checkin.js';
import { getTeamByUserId } from '../../tournament/Team.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Button, ButtonDeferType } from '../button.js';

export class CheckinModal implements Button {
    public readonly ids = ['checkin_modal'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction): Promise<void> {
        const messageId = intr.message.id;
        const tournament = await getTournamentByMessage(messageId);
        const registrationClose = moment(
            tournament.tournament_time,
            'DD-MM-YYYY HH:mm:ss'
        ).subtract(2, 'hours');

        // check if checkin is not available
        if (
            moment().isBefore(registrationClose) ||
            moment().isAfter(
                moment(tournament.tournament_time, 'DD-MM-YYYY HH:mm:ss').subtract(15, 'minutes')
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

        // if no hero points, go to checkin
        if (!tournament.hero_points) return await new CheckIn().execute(intr);

        // collect team hero selections
        const modal = new ModalBuilder()
            .setCustomId('checkin_modal_response')
            .setTitle('Check In - Team Selection');

        for (let index = 0; index < tournament.number_of_games; index++) {
            const teamSelection = new TextInputBuilder()
                .setCustomId(`team_selection_${index}`)
                // The label is the prompt the user sees for this input
                .setLabel(`Team Hero Selection: Game ${index + 1}`)
                // Short means only a single line of text
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(
                    `Format: Player: Hero, Player 2: Hero...\nMAKE SURE YOU CHECK HERO POINTS BEFORE SUBMITTING.\n`
                )
                .setMinLength(10)
                .setMaxLength(500);
            const row = new ActionRowBuilder().addComponents(
                teamSelection
            ) as ActionRowBuilder<TextInputBuilder>;
            modal.addComponents(row);
        }

        // Show the modal to the user
        await intr.showModal(modal);
    }
}
