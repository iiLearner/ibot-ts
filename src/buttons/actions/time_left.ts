import { ButtonInteraction, EmbedBuilder, resolveColor } from 'discord.js';
import moment from 'moment';

import { EventData } from '../../models/internal-models.js';
import { getTournamentByMessage, sendErrorMessage } from '../../tournament/Tournament.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
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

            const formattedStart = moment().isAfter(tournamentTime)
                ? 'Started'
                : secsToTime(tournamentTime.diff(moment(), 'seconds'));
            const formattedClose = moment().isAfter(registrationClose)
                ? 'Registration Closed'
                : secsToTime(registrationClose.diff(moment(), 'seconds'));

            const embed = new EmbedBuilder({
                title: `${tournament.name} Tournament - Time Left`,
                description: `The tournament starts in \`${formattedStart}\`\n Registrations close in \`${formattedClose}\``,
                footer: {
                    text: 'Doubts or questions? DM tournament host!',
                },
                timestamp: Date.now(),
                color: resolveColor('#6e4c70'),
            });
            await InteractionUtils.send(intr, embed, true);
        } catch (error) {
            sendErrorMessage(intr, error);
        }
    }
}

// seconds to days, hours, minutes, seconds
function secsToTime(secs: number): string {
    let d = (secs / 8.64e4) | 0;
    let H = ((secs % 8.64e4) / 3.6e3) | 0;
    let m = ((secs % 3.6e3) / 60) | 0;
    let s = secs % 60;
    let z = n => (n < 10 ? '0' : '') + n;
    return `${d} Days ${z(H)} Hours ${z(m)} Minutes and ${z(s)} Seconds`;
}
