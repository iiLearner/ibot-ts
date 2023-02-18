import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

import { EventData } from '../../models/internal-models.js';
import { Button, ButtonDeferType } from '../button.js';

export class StartTournamentButton implements Button {
    public readonly ids = ['start_tournament_modal'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction, _data: EventData): Promise<void> {
        const modal = new ModalBuilder().setCustomId('start_tournament').setTitle('Sign Up');
        // Add components to modal

        // Create the text input components
        const room_name = new TextInputBuilder()
            .setCustomId('room_name')
            // The label is the prompt the user sees for this input
            .setLabel('Room Name')
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Room Name you created')
            .setMinLength(3)
            .setMaxLength(30);

        const room_pass = new TextInputBuilder()
            .setCustomId('room_pass')
            // The label is the prompt the user sees for this input
            .setLabel('Room Password')
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Room Password')
            .setMinLength(3)
            .setMaxLength(50);

        const thirdactionrow = new ActionRowBuilder().addComponents(
            room_name
        ) as ActionRowBuilder<TextInputBuilder>;
        const secondActionRow = new ActionRowBuilder().addComponents(
            room_pass
        ) as ActionRowBuilder<TextInputBuilder>;

        // Add inputs to the modal
        modal.addComponents(thirdactionrow, secondActionRow);

        // Show the modal to the user
        await intr.showModal(modal);
    }
}
