import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    PermissionsBitField,
    PermissionsString,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import moment from 'moment-timezone';

import { EventData } from '../../models/internal-models.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { PendingTournys } from '../../utils/pending-tourneys.js';
import { Command, CommandDeferType } from '../index.js';

export class TournamentCommand implements Command {
    public names = ['tournament'];
    public deferType = CommandDeferType.NONE;
    public requireClientPerms: PermissionsString[] = [];
    public async execute(intr: ChatInputCommandInteraction, _data: EventData): Promise<void> {
        const new_args = {
            mode: intr.options.getInteger('mode'),
            time: intr.options.getString('date_time'),
            teams_limit: intr.options.getInteger('teams_limit'),
            registration_offset: intr.options.getInteger('registration_offset'),
            platform: intr.options.getString('platform'),
            games: intr.options.getInteger('games'),
            subs: intr.options.getInteger('subs'),
            log_channel: intr.options.getChannel('log_channel'),
            mention_role: intr.options.getRole('mention_role'),
            streamer: intr.options.getString('streamer'),
            hero_points: intr.options.getBoolean('hero_points'),
        };

        // set default values
        const args = this.getDefaultedArgs(new_args, intr);

        // check permissions
        if (intr.user.id !== '266947686194741248') {
            await InteractionUtils.send(
                intr,
                'You do not have permission to use this command',
                true
            );
            return;
        }

        const member = await intr.guild.members.fetch(intr.client.user.id);

        // check if we have role creation permissions
        if (!member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            await InteractionUtils.send(
                intr,
                'I do not have permission to create roles, please give me the `Manage Roles` permission',
                true
            );
            return;
        }

        const datetime = moment(args.time, 'DD-MM-YYYY HH:mm:ss');
        if (!datetime.isValid() || datetime.isBefore(moment())) {
            if (intr.replied || intr.deferred) {
                await intr.followUp({ content: 'Invalid date/time', ephemeral: true });
                return;
            } else {
                await intr.reply({ content: 'Invalid date/time', ephemeral: true });
                return;
            }
        }

        // local map to keep track of pending tournys
        const ppndingTournys = new PendingTournys();
        ppndingTournys.addTournament(intr.user.id, args);

        // prepare modal
        const modal = new ModalBuilder()
            .setCustomId('tournament_create')
            .setTitle('Create a tourney');

        const tName = new TextInputBuilder()
            .setCustomId(`tournament_create_name`)
            // The label is the prompt the user sees for this input
            .setLabel(`Name`)
            // Short means only a single line of text
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`Tournament name`)
            .setMinLength(3)
            .setMaxLength(128);
        const rowName = new ActionRowBuilder().addComponents(
            tName
        ) as ActionRowBuilder<TextInputBuilder>;
        modal.addComponents(rowName);

        const tDesccription = new TextInputBuilder()
            .setCustomId(`tournament_create_description`)
            // The label is the prompt the user sees for this input
            .setLabel(`Description`)
            // Short means only a single line of text
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(`Enter a short description for the tournament.`)
            .setRequired(false)
            .setMinLength(0)
            .setMaxLength(800);

        const row = new ActionRowBuilder().addComponents(
            tDesccription
        ) as ActionRowBuilder<TextInputBuilder>;
        modal.addComponents(row);

        // Show the modal to the user
        await intr.showModal(modal);
    }

    getDefaultedArgs(args: any, intr: ChatInputCommandInteraction): any {
        return {
            ...args,
            registration_offset: args.registration_offset || 2,
            platform: args.platform || 'ALL',
            games: args.games || 3,
            subs: args.subs || 0,
            log_channel: args.log_channel ? args.log_channel.id : intr.channel.id,
            mention_role: args.mention_role ? args.mention_role.id : null,
            streamer: args.streamer || null,
            hero_points: args.hero_points || false,
        };
    }
}
