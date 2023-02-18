import { EmbedBuilder, ModalSubmitInteraction, resolveColor } from 'discord.js';

import { Player } from '../../tournament/Player.js';
import { getTeamByCode, getTeamMembers } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class SignUpTeamModal implements Modal {
    ids: ['signup_team_modal'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        try {
            const messageId = intr.message.id;
            const playerName = intr.fields.getTextInputValue('ingame_name');
            const teamName = intr.fields.getTextInputValue('team_name');
            const playerid = intr.fields.getTextInputValue('ingame_id');
            const tournament = await getTournamentByMessage(messageId);
            if (tournament.isTournamentClosed()) return await tournament.tournamentClosed(intr);

            const team = await getTeamByCode(teamName);
            if (await team.isPlayerInTeam()) return await team.playerInTeam(intr, tournament);

            const teamMembers = await getTeamMembers(teamName);
            let teamMembersNames = '';
            if (teamMembers.length > 0) {
                teamMembers.forEach(
                    async member =>
                        (teamMembersNames += `${
                            (await intr.client.users.fetch(member.userid)).tag
                        }, `)
                );
                teamMembersNames += `${intr.user.tag}`;
            } else {
                teamMembersNames += `No members yet!`;
            }

            if (team.isTeamFull(tournament, teamMembers))
                return await team.teamFull(intr, tournament, teamName);

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
            if (role) await(await intr.guild.members.fetch(intr.user.id)).roles.add(role);

            const msrole = await intr.guild.roles.fetch('1064512125617328158');
            if (msrole) await(await intr.guild.members.fetch(intr.user.id)).roles.add(msrole);

            // send success message
            await tournament.tournamentSuccessTeam(intr, team, player.ig_name, 1, teamMembersNames);
        } catch (error) {
            sendErrorMessage(error, intr);
        }
    }
}
