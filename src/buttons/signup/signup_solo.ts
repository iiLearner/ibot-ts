import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

import { EventData } from '../../models/internal-models.js';
import { Button, ButtonDeferType } from '../button.js';

export class SignUpSoloButton implements Button {
    public readonly ids = ['sign_up_solo'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction, _data: EventData): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('signup_solo_modal')
            .setTitle('Sign Up (Solo)');

        const ingame_name = new TextInputBuilder()
            .setCustomId('ingame_name')
            // The label is the prompt the user sees for this input
            .setLabel('In game Name')
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('In game Name')
            .setMinLength(3)
            .setMaxLength(50);

        const ingame_id = new TextInputBuilder()
            .setCustomId('ingame_id')
            // The label is the prompt the user sees for this input
            .setLabel('In game ID')
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('In game ID')
            .setMinLength(8)
            .setMaxLength(30);

        const secondActionRow = new ActionRowBuilder().addComponents(
            ingame_name
        ) as ActionRowBuilder<TextInputBuilder>;
        const firstActionRow = new ActionRowBuilder().addComponents(
            ingame_id
        ) as ActionRowBuilder<TextInputBuilder>;

        // Add inputs to the modal
        modal.addComponents(secondActionRow, firstActionRow);

        // Show the modal to the user
        await intr.showModal(modal);
    }
}
