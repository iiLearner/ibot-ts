import { resolveColor, EmbedBuilder, TextChannel } from 'discord.js';
import moment from 'moment';

import { CustomClient } from '../extensions/custom-client.js';
import { getTournamentsByStatus } from '../tournament/Tournament.js';
import { Job } from './job.js';

export class CheckInChecker implements Job {
    name = 'CheckInChecker';
    log = false;
    schedule = '*/5 * * * *';

    constructor(private client: CustomClient) {}

    async run(): Promise<void> {
        const activeTournaments = await getTournamentsByStatus(1);
        if (activeTournaments.length === 0) return;

        for (let tournament of activeTournaments) {
            // is registration closed?
            const tournamentClose = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).subtract(2, 'hours');

            if (moment().isAfter(tournamentClose)) {
                // registration is closed, open check-in
                const embed = new EmbedBuilder({
                    title: `${tournament.name} Tournament check-in`,
                    description: `The check-in for this tournament has opened, click the button below to check-in!\nOnly teams that have checked-in will be able to play in the tournament!\n\nCheck-in will close 20mins before the tournament!`,
                    footer: {
                        text: 'Only team leaders can check-in!',
                    },
                    timestamp: Date.now(),
                    color: resolveColor('#6e4c70'),
                });

                const channel = this.client.channels.cache.get(
                    tournament.main_channel
                ) as TextChannel;
                if (channel) {
                    await tournament.updateTournamentStatus(2);
                    const msg = await channel.send({
                        content: `<@&${tournament.role_id}>`,
                        embeds: [embed],
                        allowedMentions: { parse: ['roles'] },
                        components: [
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 1,
                                        label: 'Check-in',
                                        custom_id: 'checkin_modal',
                                    },
                                    {
                                        type: 2,
                                        style: 2,
                                        label: 'Start Tournament',
                                        custom_id: 'start_tournament_modal',
                                    },
                                    {
                                        type: 2,
                                        style: 2,
                                        label: 'Time Left',
                                        custom_id: 'sign_up_time_left',
                                    },
                                    {
                                        type: 2,
                                        style: 2,
                                        label: 'Teams',
                                        custom_id: 'tournament_teams',
                                    },
                                ],
                            },
                        ],
                    });
                    await tournament.updateTournamentCi(msg.id); // update the check-in message id
                }
            }
        }
    }
}
