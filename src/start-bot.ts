import { REST } from '@discordjs/rest';
import { Options, Partials, TextChannel } from 'discord.js';
import { createRequire } from 'node:module';

import { Button } from './buttons/index.js';
import { SignUpButton, SignUpSoloButton, SignUpTeamButton } from './buttons/tournament/index.js';
import { ChatCommandMetadata, Command } from './commands/index.js';
import { TournamentCommand } from './commands/modal/index.js';
import { DBConnection } from './database/connect.js';
import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
    TriggerHandler,
} from './events/index.js';
import { CustomClient } from './extensions/index.js';
import { Job } from './jobs/index.js';
import { Bot } from './models/bot.js';
import { Reaction } from './reactions/index.js';
import {
    CommandRegistrationService,
    EventDataService,
    JobService,
    Logger,
} from './services/index.js';
import { Tournament } from './tournament/Tournament.js';
import { Trigger } from './triggers/index.js';
import { Team } from './tournament/Team.js';
import { SignUpTimeLeft } from './buttons/tournament/time_left.js';
import { SignOff } from './buttons/tournament/signoff.js';
import { TournametTeams } from './buttons/tournament/teams.js';
import { CheckInChecker } from './jobs/checkin-checker.js';
import moment from 'moment';
import { StartTournamentButton } from './buttons/tournament/start_tournament.js';
import { CheckIn } from './buttons/tournament/checkin.js';
import { DeleterChecker } from './jobs/deleter.js';
import { CheckinModal } from './buttons/tournament/checkin_modal.js';

const require = createRequire(import.meta.url);
let Config = require('../config/config.json');
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    // Services
    let eventDataService = new EventDataService();

    // Client
    let client = new CustomClient({
        intents: Config.client.intents,
        partials: (Config.client.partials as string[]).map(partial => Partials[partial]),
        makeCache: Options.cacheWithLimits({
            // Keep default caching behavior
            ...Options.DefaultMakeCacheSettings,
            // Override specific options from config
            ...Config.client.caches,
        }),
    });

    // Commands
    let commands: Command[] = [
        // Chat Commands
        //new HelpCommand(),
        //new InfoCommand(),
        //new TestCommand(),

        // Message Context Commands
        ///new ViewDateSent(),

        // User Context Commands
        //new ViewDateJoined(),

        new TournamentCommand(),

        // TODO: Add new commands here
    ];

    // Buttons
    let buttons: Button[] = [
        new SignUpButton(),
        new SignUpSoloButton(),
        new SignUpTeamButton(),
        new CheckinModal(),
        new SignUpTimeLeft(),
        new SignOff(),
        new CheckIn(),
        new TournametTeams(),
        new StartTournamentButton(),
    ];

    // Reactions
    let reactions: Reaction[] = [
        // TODO: Add new reactions here
    ];

    // Triggers
    let triggers: Trigger[] = [
        // TODO: Add new triggers here
    ];

    // Event handlers
    let guildJoinHandler = new GuildJoinHandler(eventDataService);
    let guildLeaveHandler = new GuildLeaveHandler();
    let commandHandler = new CommandHandler(commands, eventDataService);
    let buttonHandler = new ButtonHandler(buttons, eventDataService);
    let triggerHandler = new TriggerHandler(triggers, eventDataService);
    let messageHandler = new MessageHandler(triggerHandler);
    let reactionHandler = new ReactionHandler(reactions, eventDataService);

    // Jobs
    let jobs: Job[] = [
        new CheckInChecker(client),
        new DeleterChecker(client),
        // TODO: Add new jobs here
    ];

    // Bot
    let bot = new Bot(
        Config.client.token,
        client,
        guildJoinHandler,
        guildLeaveHandler,
        messageHandler,
        commandHandler,
        buttonHandler,
        reactionHandler,
        new JobService(jobs)
    );

    // set timezone
    moment.tz.setDefault('Europe/Rome');

    // Register
    if (process.argv[2] == 'commands') {
        try {
            let rest = new REST({ version: '10' }).setToken(Config.client.token);
            let commandRegistrationService = new CommandRegistrationService(rest);
            let localCmds = [
                ...Object.values(ChatCommandMetadata).sort((a, b) => (a.name > b.name ? 1 : -1)),
            ];
            await commandRegistrationService.process(localCmds, process.argv);
        } catch (error) {
            Logger.error(Logs.error.commandAction, error);
        }
        // Wait for any final logs to be written.
        await new Promise(resolve => setTimeout(resolve, 1000));
        process.exit();
    }

    await bot.start();

    // database connection
    new DBConnection(Config);
}

process.on('unhandledRejection', (reason, _promise) => {
    Logger.error(Logs.error.unhandledRejection, reason);
});

start().catch(error => {
    Logger.error(Logs.error.unspecified, error);
});