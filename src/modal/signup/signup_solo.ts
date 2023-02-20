import { ModalSubmitInteraction } from 'discord.js';

import { Player } from '../../tournament/Player.js';
import { Team } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class SignUpSoloModal implements Modal {
    ids: ['signup_solo_modal'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        try {
            const messageId = intr.message.id;
            const playerName = intr.fields.getTextInputValue('ingame_name');
            const playerid = intr.fields.getTextInputValue('ingame_id');
            const tournament = await getTournamentByMessage(messageId);

            // checks
            if (tournament.isTournamentClosed()) return await tournament.tournamentClosed(intr);
            if (await tournament.isTournamentFull()) return await tournament.tournamentFull(intr);

            const team = new Team(
                playerName,
                intr.user.username,
                intr.user.id,
                tournament.id,
                intr.user.avatarURL() ?? 'https://i.imgur.com/V4FP5W7.png'
            );

            if (await team.isTeamNameTaken()) return await team.teamNameTaken(intr, tournament);
            if (await team.isPlayerInTeam()) return await team.playerInTeam(intr, tournament);

            await team.createTeam();
            await team.getLastTeamInfo();

            const player = new Player(
                intr.user.id,
                intr.user.tag,
                playerName,
                playerid,
                team.teamId
            );
            await player.createPlayer();

            //give user the role
            const role = await intr.guild.roles.fetch(tournament.role_id);
            if (role) await (await intr.guild.members.fetch(intr.user.id)).roles.add(role);

            const msrole = await intr.guild.roles.fetch('1064512125617328158');
            if (msrole) await (await intr.guild.members.fetch(intr.user.id)).roles.add(msrole);

            tournament.tournamentSuccessSolo(intr);
        } catch (error) {
            sendErrorMessage(error, intr);
        }
    }
}
