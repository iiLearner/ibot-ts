import { ButtonInteraction, EmbedBuilder, resolveColor } from 'discord.js';
import moment from 'moment';

import { EventData } from '../../models/internal-models.js';
import { getTournamentByMessage } from '../../tournament/Tournament.js';
import { Button, ButtonDeferType } from '../button.js';

export class SignUpTimeLeft implements Button {
    public readonly ids = ['sign_up_time_left'];
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
            const tournamentTime = moment(tournament.tournament_time, 'DD-MM-YYYY HH:mm:ss');

            const formattedStart = secsToTime(tournamentTime.diff(moment(), 'seconds'));
            const formattedClose = secsToTime(registrationClose.diff(moment(), 'seconds'));

            // if its already started, then show it
            if (moment().isAfter(tournamentTime)) {
                const embed = new EmbedBuilder({
                    title: 'Moonbane Slayers Tournament - Time Left',
                    description: `The tournament has already started!`,
                    footer: {
                        text: 'Doubts or questions? DM tournament host!',
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

            const embed = new EmbedBuilder({
                title: 'Moonbane Slayers Tournament - Time Left',
                description: `The tournament starts in \`${formattedStart}\`\n Registrations close in \`${formattedClose}\``,
                footer: {
                    text: 'Doubts or questions? DM tournament host!',
                },
                timestamp: Date.now(),
                color: resolveColor('#6e4c70'),
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
        } catch (error) {
            if (intr.replied || intr.deferred) {
                intr.editReply({
                    content: `An unknown error happened, please report to the dev:  ${error}`,
                });
            } else {
                intr.reply({
                    content: `An unknown error happened, please report to the dev:  ${error}`,
                    ephemeral: true,
                });
            }
        }
    }

    // seconds to days, hours, minutes, seconds
}

function secsToTime(secs: number): string {
    let d = (secs / 8.64e4) | 0;
    let H = ((secs % 8.64e4) / 3.6e3) | 0;
    let m = ((secs % 3.6e3) / 60) | 0;
    let s = secs % 60;
    let z = n => (n < 10 ? '0' : '') + n;
    return `${d} Days ${z(H)} Hours ${z(m)} Minutes and ${z(s)} Seconds`;
}
