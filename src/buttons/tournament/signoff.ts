import { ButtonInteraction, resolveColor, EmbedBuilder, TextChannel } from 'discord.js';
import moment from 'moment';

import { EventData } from '../../models/internal-models.js';
import {
    getTeamByUserId,
    getTeamMembers,
    removePlayerFromTeam,
    removeTeam,
} from '../../tournament/Team.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { Button, ButtonDeferType } from '../button.js';

export class SignOff implements Button {
    public readonly ids = ['sign_off'];
    public readonly deferType = ButtonDeferType.NONE;
    public readonly requireEmbedAuthorTag = true;
    public readonly requireGuild = true;

    public async execute(intr: ButtonInteraction, _data: EventData): Promise<void> {
        const messageId = intr.message.id;
        try {
            const tournament = await getTournamentByMessage(messageId);
            const registrationClose = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).subtract(2, 'hours');

            // check if registrations are closed
            if (moment().isAfter(registrationClose)) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `Registrations are closed, you can't sign off anymore!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // get the user's team
            const team = await getTeamByUserId(intr.user.id, tournament.id);
            if (team === null) {
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `You are not registered for this tournament!`,
                    footer: {
                        text: 'See something wrong? Contact a moderator!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#fe0c03'),
                });
                await InteractionUtils.send(intr, embed, true);
                return;
            }

            // check if the user is team captain
            if (team.teamLeaderId !== intr.user.id) {
                await removePlayerFromTeam(intr.user.id, team.tID);

                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament`,
                    description: `You have been removed from the team!`,
                    footer: {
                        text: 'You are no longer registered to the tournament!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#008080'),
                });
                await InteractionUtils.send(intr, embed, true);

                // send info message
                await (intr.client.channels.cache.get(tournament.log_channel) as TextChannel).send({
                    content: `<:please:805637324670107679> | Player \`${intr.user.tag}\` has unregistered from the tournament!`,
                });

                // send message to user
                await intr.user.send({
                    content: `<@${intr.user.id}>! You have unregistered from the tournament!`,
                });

                // send message to team leader
                const teamLeader = await intr.client.users.fetch(team.teamLeaderId);
                await teamLeader.send({
                    content: `<@${team.teamLeaderId}>! Player \`${intr.user.tag}\` has left you your team \`${team.teamName}\`! `,
                });
            } else {
                const teamMembers = await getTeamMembers(team.teamCode);
                await removeTeam(team.teamId);
                teamMembers.forEach(async member => {
                    if (member.userid === intr.user.id) return;

                    // send message to team members
                    const teamMember = await intr.client.users.fetch(member.userid);
                    await teamMember.send({
                        content: `<@${member.userid}>! Your team leader \`${intr.user.tag}\` has disbanded your team \`${team.teamName}\`!\nYou are no longer registered to the tournament`,
                    });
                });

                if (tournament.mode !== 1) {
                    // send info message
                    await (
                        intr.client.channels.cache.get(tournament.log_channel) as TextChannel
                    ).send({
                        content: `<:please:805637324670107679> | Team \`${team.teamName}\` has been disbanded by team leader \`${intr.user.tag}\`!`,
                    });

                    // send message to user
                    await intr.user.send({
                        content: `<@${intr.user.id}>! You have disbanded your team \`${team.teamName}\`!`,
                    });

                    const embed = new EmbedBuilder({
                        title: `${tournament.name} Tournament`,
                        description: `You have successfully disbanded your team!`,
                        footer: {
                            text: 'You are no longer registered to the tournament!',
                        },
                        timestamp: Date.now(),
                        color: resolveColor('#008080'),
                    });
                    await InteractionUtils.send(intr, embed, true);
                } else {
                    // send info message
                    await (
                        intr.client.channels.cache.get(tournament.log_channel) as TextChannel
                    ).send({
                        content: `<:please:805637324670107679> | \`${intr.user.tag}\` has unregistered from the tournament!`,
                    });

                    // send message to user
                    await intr.user.send({
                        content: `<@${intr.user.id}>! You have successfully unregistered from the tournament!`,
                    });

                    const embed = new EmbedBuilder({
                        title: `${tournament.name} Tournament`,
                        description: `You have successfully left the tournament!`,
                        footer: {
                            text: 'You are no longer registered to the tournament!',
                        },
                        timestamp: Date.now(),
                        color: resolveColor('#008080'),
                    });
                    await InteractionUtils.send(intr, embed, true);
                }
            }

            //remove user role
            const role = await intr.guild.roles.fetch(tournament.role_id);
            if (role) await (await intr.guild.members.fetch(intr.user.id)).roles.remove(role);
        } catch (error) {
            sendErrorMessage(error, intr);
        }
    }

    // seconds to days, hours, minutes, seconds
}
