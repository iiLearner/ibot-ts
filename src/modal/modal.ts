import { ModalSubmitInteraction } from 'discord.js';

export interface Modal {
    ids: string[];
    execute(intr: ModalSubmitInteraction): Promise<void>;
}

export enum ButtonDeferType {
    REPLY = 'REPLY',
    UPDATE = 'UPDATE',
    NONE = 'NONE',
}
