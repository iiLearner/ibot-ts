import { EmbedBuilder, ModalSubmitInteraction, TextChannel, resolveColor } from 'discord.js';
import moment from 'moment';

import { Player } from '../../tournament/Player.js';
import { Team, getTournamentTeams } from '../../tournament/Team.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';
import { Modal } from '../index.js';

export class SignUpModal implements Modal {
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
            const team = new Team(
                teamName,
                intr.user.username,
                intr.user.id,
                tournament.id,
                intr.user.avatarURL() ?? 'https://i.imgur.com/V4FP5W7.png'
            );

            if (await team.isTeamNameTaken(teamName, tournament.id)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament',
                    description: `The team name ${playerName} is already taken, please try again with a different name.`,
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

            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament',
                description: `You have successfully signed up for the tournament\nTeam Code: \`${team.teamCode}\`\nShare the team code with your teammates so they can join your team!`,
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
            (intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send({
                content: `<:guud:824542470015680542> | Team Leader \`${intr.user.tag}\` has signed up for the tournament with team \`${team.teamName}\`!`,
            });

            // send message to user
            intr.user.send({
                content: `<@${intr.user.id}>! You have successfully signed up for the tournament! Find below your tournament details\`\`\`Team name: ${team.teamName}\nTeam captain: ${intr.user.tag}\nTeam Code: ${team.teamCode}\nTournament Time: ${tournament.tournament_time}\`\`\`Share the team code with your teammates so they can join your team!`,
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
}
