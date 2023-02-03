import { EmbedBuilder, ModalSubmitInteraction, TextChannel, resolveColor } from 'discord.js';
import moment from 'moment';

import { Player } from '../../tournament/Player.js';
import { getTeamByCode, getTeamMembers, getTournamentTeams } from '../../tournament/Team.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class SignUpTeamModal implements Modal {
    ids: ['signup_team_modal'];
    public async execute(intr: ModalSubmitInteraction): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);
            const registrationClose = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).subtract(2, 'hours');
            if (moment().isAfter(registrationClose)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `The registration for this tournament has closed!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });

                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            const currentTeamCount = await getTournamentTeams(tournament.id);
            if (
                (tournament.mode === 3 && currentTeamCount >= 20) ||
                (tournament.mode === 2 && currentTeamCount >= 30)
            ) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `Sorry! The tournament is currently at full capacity!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            const playerName = intr.fields.getTextInputValue('ingame_name');
            const teamName = intr.fields.getTextInputValue('team_name');
            const playerid = intr.fields.getTextInputValue('ingame_id');
            const team = await getTeamByCode(teamName);

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

            if (this.isTeamFull(tournament.mode, teamMembers)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `The team ${teamName} is already full!`,
                    footer: {
                        text: "think it's a mistake? Contact a moderator!",
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

            if (await team.isPlayerInTeam(tournament.id, intr.user.id)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `You have already signed up for the tournament!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                if (intr.replied || intr.deferred) {
                    intr.editReply({
                        embeds: [embed],
                    });
                } else {
                    intr.reply({
                        embeds: [embed],
                        ephemeral: true,
                    });
                }
                return;
            }

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

            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `You have successfully signed up for the tournament`,
                footer: {
                    text: 'You will be notified when the tournament starts!',
                },
                timestamp: Date.now(),
                color: resolveColor('#008080'),
            });
            if (intr.replied || intr.deferred) {
                intr.editReply({
                    embeds: [embed],
                });
            } else {
                intr.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }

            // send info message
            await (intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send({
                content: `<:guud:824542470015680542> | Player \`${intr.user.tag}\` has joined the team \`${team.teamName}\`!`,
            });

            // send message to user
            await intr.user.send({
                content: `<@${intr.user.id}>! You have successfully joined the team \`${team.teamName}\` for the tournament! Find below your team details\`\`\`Team name: ${team.teamName}\nTeam captain: ${team.teamLeader}\nTeam Code: ${team.teamCode}\nTeam Members: ${teamMembersNames}\`\`\`Share the team code with your teammates so they can join your team!`,
            });

            // send message to team leader
            const teamLeader = await intr.client.users.fetch(team.teamLeaderId);
            await teamLeader.send({
                content: `<@${team.teamLeaderId}>! Player \`${intr.user.tag} (${player.ig_name})\` has joined your team \`${team.teamName}\`! Find below your team details\`\`\`Team name: ${team.teamName}\nTeam captain: ${team.teamLeader}\nTeam Code: ${team.teamCode}\nTeam Members: ${teamMembersNames}\nTournament Time: ${tournament.tournament_time}\`\`\`Share the team code with your teammates so they can join your team!`,
            });
        } catch (error) {
            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `An unknown error happened, please report to the dev:  ${error}`,
                footer: {
                    text: 'Need help? Contact a moderator!',
                },
                timestamp: Date.now(),
                color: resolveColor('#fe0c03'),
            });
            if (intr.replied || intr.deferred) {
                intr.editReply({
                    embeds: [embed],
                });
            } else {
                intr.reply({
                    embeds: [embed],
                    ephemeral: true,
                });
            }
        }
    }

    isTeamFull(mode: number, teamMembers: Player[]): boolean {
        if (mode === 1) {
            if (teamMembers.length > 1) {
                return true;
            }
        } else if (mode === 2) {
            if (teamMembers.length > 3) {
                return true;
            }
        } else if (mode === 3) {
            if (teamMembers.length > 5) {
                return true;
            }
        }
        return false;
    }
}
