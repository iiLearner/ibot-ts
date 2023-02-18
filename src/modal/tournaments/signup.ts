import { EmbedBuilder, ModalSubmitInteraction, resolveColor } from 'discord.js';

import { Player } from '../../tournament/Player.js';
import { Team } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class SignUpModal implements Modal {
    ids: ['signup_team_modal'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        try {
            const messageId = intr.message.id;
            const tournament = await getTournamentByMessage(messageId);
            if (tournament.isTournamentClosed()) return tournament.tournamentClosed(intr);
            if (tournament.isTournamentFull()) return tournament.tournamentFull(intr);

            const playerName = intr.fields.getTextInputValue('ingame_name');
            const teamName = intr.fields.getTextInputValue('team_name');
            const playerid = intr.fields.getTextInputValue('ingame_id');
            const team = new Team(
                teamName,
                intr.user.username,
                intr.user.id,
                tournament.id,
                intr.user.avatarURL() ?? 'https://i.imgur.com/V4FP5W7.png'
            );

            if (await team.isTeamNameTaken()) return team.teamNameTaken(intr, tournament);
            if (await team.isPlayerInTeam()) return team.playerInTeam(intr, tournament);

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

            await tournament.tournamentSuccessTeam(intr, team, player.ig_name, 2);
        } catch (error) {
            sendErrorMessage(error, intr);
        }
    }
}
