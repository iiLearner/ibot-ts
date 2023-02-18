import { TextChannel } from 'discord.js';
import moment from 'moment';

import { CustomClient } from '../extensions/custom-client.js';
import { getTournamentsByStatus } from '../tournament/Tournament.js';
import { Job } from './job.js';

export class DeleterChecker implements Job {
    name = 'DeleterChecker';
    log = false;
    schedule = '*/60 * * * *';

    constructor(private client: CustomClient) {}

    async run(): Promise<void> {
        const activeTournaments = await getTournamentsByStatus(3);
        if (activeTournaments.length === 0) return;

        for (let tournament of activeTournaments) {
            // is registration closed?
            const tournamentDeletion = moment(
                tournament.tournament_time,
                'DD-MM-YYYY HH:mm:ss'
            ).add(12, 'hours');

            if (moment().isAfter(tournamentDeletion)) {
                // delete the tournament

                try {
                    const main_message = await (
                        this.client.channels.cache.get(tournament.main_channel) as TextChannel
                    ).messages.fetch(tournament.message_id);
                    if (main_message) await main_message.delete();
                } catch (error) {
                    console.log("Couldn't delete the main message");
                }

                try {
                    const checkin_message = await (
                        this.client.channels.cache.get(tournament.main_channel) as TextChannel
                    ).messages.fetch(tournament.message_id_ci);
                    if (checkin_message) await checkin_message.delete();
                } catch (error) {
                    console.log("Couldn't delete the checkin message");
                }

                try {
                    // role
                    const role = await this.client.guilds.cache
                        .get(tournament.serverid)
                        .roles.fetch(tournament.role_id);

                    // delete the role
                    if (role) await role.delete();
                } catch (error) {
                    console.log("Couldn't delete the role");
                }

                await tournament.updateTournamentStatus(4);

                // send a message to the log channel
                const logChannel = this.client.channels.cache.get(
                    tournament.log_channel
                ) as TextChannel;
                if (logChannel) {
                    await logChannel.send({
                        content: `The tournament has termintated for the week, feel free to leave your feedback in the same channel!`,
                    });
                }
            }
        }
    }
}
