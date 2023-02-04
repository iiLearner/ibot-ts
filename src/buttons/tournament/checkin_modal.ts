import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

import { Button, ButtonDeferType } from '../button.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';

export class CheckinModal implements Button {
    public readonly ids = ['checkin_modal'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('checkin_modal_response')
            .setTitle('Check In - Team Selection');
        const messageId = intr.message.id;
        const tournament = await getTournamentByMessage(messageId);

        for (let index = 0; index < tournament.mode; index++) {
            const teamSelection = new TextInputBuilder()
                .setCustomId(`team_selection_${index}`)
                // The label is the prompt the user sees for this input
                .setLabel(`Team Hero Selection: Game ${index + 1}`)
                // Short means only a single line of text
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder(
                    `Format: Player: Hero, Player 2: Hero...\nMAKE SURE YOU CHECK HERO POINTS BEFORE SUBMITTING.\n`
                )
                .setMinLength(30)
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
