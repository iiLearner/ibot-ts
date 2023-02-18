import { ButtonInteraction, EmbedBuilder, resolveColor } from 'discord.js';

import { EventData } from '../../models/internal-models.js';
import { getTournamentTeamsDetailed } from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Button, ButtonDeferType } from '../button.js';

type teamDetails = {
    teamName: string;
    teamStatus: number;
    players: { ig_name: string; ig_id: string; userid: string; username: string }[];
};

export class TournametTeams implements Button {
    public readonly ids = ['tournament_teams'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction, _data: EventData): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);
            const teamsDetails = (await getTournamentTeamsDetailed(tournament.id)) as teamDetails[];

            if (teamsDetails === null || teamsDetails.length === 0) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament - Teams`,
                    description: 'No teams',
                    footer: {
                        text:
                            'Current teams: ' +
                            this.getPartyLimit(tournament.mode, 0) +
                            ` • Need help? DM tournament host!`,
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#6e4c70'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            const embed = new EmbedBuilder({
                title: `${tournament.name} Tournament - Teams`,
                footer: {
                    text:
                        'Current teams: ' +
                        this.getPartyLimit(tournament.mode, teamsDetails.length) +
                        ` • Need help? DM tournament host!`,
                },
                timestamp: Date.now(),
                color: resolveColor('#6e4c70'),
            });

            // add half teams to field 1
            let firstHalf = '';
            for (let i = 0; i < Math.ceil(teamsDetails.length / 2); i++) {
                const team = teamsDetails[i];
                const teamPlayers = team.players.map(player => {
                    return `${player.username} (${player.ig_name})`;
                });

                const pTeamPlayers = teamPlayers;
                if (tournament.mode !== 1) {
                    firstHalf += `${team.teamName} \`(${team.players.length}/${
                        tournament.mode
                    })\`\n${pTeamPlayers.join('\n')}\n\n`;
                } else {
                    firstHalf += `\n${pTeamPlayers.join('\n')}${team.teamStatus == 2 ? '✓' : ''}\n`;
                }
            }
            embed.addFields({
                name: ' ',
                value: firstHalf,
                inline: true,
            });

            if (teamsDetails.length > 1) {
                // add half teams to field 2
                let secondHalf = '';
                for (let i = Math.ceil(teamsDetails.length / 2); i < teamsDetails.length; i++) {
                    const team = teamsDetails[i];
                    const teamPlayers = team.players.map(player => {
                        return `${player.username} (${player.ig_name})`;
                    });

                    const pTeamPlayers = teamPlayers;
                    if (tournament.mode !== 1) {
                        secondHalf += `${team.teamName} \`(${team.players.length}/${
                            tournament.mode
                        })\`\n${pTeamPlayers.join('\n')}\n\n`;
                    } else {
                        secondHalf += `\n${pTeamPlayers.join('\n')}${
                            team.teamStatus == 2 ? '✓' : ''
                        }\n`;
                    }
                }
                embed.addFields({
                    name: ' ',
                    value: secondHalf,
                    inline: true,
                });
            }

            if (intr.replied || intr.deferred) {
                intr.followUp({
                    embeds: [embed],
                });
            } else {
                intr.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
        } catch (error) {
            sendErrorMessage(intr, error);
        }
    }

    getPartyLimit(mode: number, teams: number): string {
        switch (mode) {
            case 1:
                return `\`${teams}/${60}\` teams`;
            case 2:
                return `\`${teams}/30\` teams`;
            case 3:
                return `\`${teams}/20\` teams`;
            default:
                return 'Invalid';
        }
    }

    // seconds to days, hours, minutes, seconds
}
