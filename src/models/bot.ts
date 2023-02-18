import {
    AutocompleteInteraction,
    ButtonInteraction,
    Client,
    CommandInteraction,
    EmbedBuilder,
    Events,
    Guild,
    Interaction,
    Message,
    MessageReaction,
    PartialMessageReaction,
    PartialUser,
    RateLimitData,
    RESTEvents,
    TextChannel,
    User,
} from 'discord.js';
import { createRequire } from 'node:module';

import {
    ButtonHandler,
    CommandHandler,
    GuildJoinHandler,
    GuildLeaveHandler,
    MessageHandler,
    ReactionHandler,
} from '../events/index.js';
import { StartTournamentModal } from '../modal/actions/start_tournament.js';
import { CheckIn } from '../modal/checkin/checkin.js';
import { SignUpModal } from '../modal/signup/signup.js';
import { SignUpSoloModal } from '../modal/signup/signup_solo.js';
import { JobService, Logger } from '../services/index.js';
import { PartialUtils } from '../utils/index.js';
import { SignUpTeamModal } from '../modal/signup/signup_team.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Debug = require('../../config/debug.json');
let Logs = require('../../lang/logs.json');

export class Bot {
    private ready = false;

    constructor(
        private token: string,
        private client: Client,
        private guildJoinHandler: GuildJoinHandler,
        private guildLeaveHandler: GuildLeaveHandler,
        private messageHandler: MessageHandler,
        private commandHandler: CommandHandler,
        private buttonHandler: ButtonHandler,
        private reactionHandler: ReactionHandler,
        private jobService: JobService
    ) {}

    public async start(): Promise<void> {
        this.registerListeners();
        await this.login(this.token);
    }

    private registerListeners(): void {
        this.client.on(Events.ClientReady, () => this.onReady());
        this.client.on(Events.ShardReady, (shardId: number, unavailableGuilds: Set<string>) =>
            this.onShardReady(shardId, unavailableGuilds)
        );
        this.client.on(Events.GuildCreate, (guild: Guild) => this.onGuildJoin(guild));
        this.client.on(Events.GuildDelete, (guild: Guild) => this.onGuildLeave(guild));
        this.client.on(Events.MessageCreate, (msg: Message) => this.onMessage(msg));
        this.client.on(Events.InteractionCreate, (intr: Interaction) => this.onInteraction(intr));
        this.client.on(
            Events.MessageReactionAdd,
            (messageReaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) =>
                this.onReaction(messageReaction, user)
        );
        this.client.rest.on(RESTEvents.RateLimited, (rateLimitData: RateLimitData) =>
            this.onRateLimit(rateLimitData)
        );
    }

    private async login(token: string): Promise<void> {
        try {
            await this.client.login(token);
        } catch (error) {
            Logger.error(Logs.error.clientLogin, error);
            return;
        }
    }

    private async onReady(): Promise<void> {
        let userTag = this.client.user?.tag;
        Logger.info(Logs.info.clientLogin.replaceAll('{USER_TAG}', userTag));

        this.jobService.start();
        //if (!Debug.dummyMode.enabled) {
        //}

        this.ready = true;

        /*const placementToScore = (placement: number) => {
            switch (placement) {
                case 1:
                    return 100;
                case 2:
                    return 80;
                case 3:
                    return 60;
                case 4:
                case 5:
                case 6:
                case 7:
                case 8:
                case 9:
                case 10:
                    return 30;
                default:
                    return 0;
            }
        };

        const killsToScore = (kills: number) => kills * 15;

        // lets post the leaderboard
        const channel = (await this.client.channels.fetch('1064510367679664128')) as TextChannel;

        const db = new DBConnection();
        db.con.query(
            'SELECT placement.gameID, placement.placement, teams.teamName, teams.teamID from placement, teams WHERE teams.teamID = placement.teamID AND teams.tID = 74 ORDER BY placement.ID',
            (err, placements) => {
                db.con.query(
                    'SELECT kills.kills, teams.teamID, kills.gameID from players, kills, teams WHERE teams.tID = 74 AND teams.teamStatus = 2 and teams.teamID = players.teamID and players.ID = kills.playerID',
                    (err, kills) => {
                        // lets build the table
                        const table = placements.map((placement: any) => {
                            // loop for games
                            const teamStats = [1, 2, 3].map(index => {
                                const kills_ = kills.filter(
                                    (kill: any) =>
                                        kill.gameID === index && kill.teamID === placement.teamID
                                );

                                // sum kills
                                const killsSum = kills_.reduce((acc: any, current: any) => {
                                    return acc + current.kills;
                                }, 0);

                                // get placement for game id 1
                                const gamePlacement = placements.find(
                                    (placement_: any) =>
                                        placement_.gameID === index &&
                                        placement_.teamID === placement.teamID
                                );
                                const key = {
                                    [`game${index}`]:
                                        placementToScore(gamePlacement.placement) +
                                        killsToScore(killsSum),
                                };
                                return {
                                    key,
                                };
                            });

                            return {
                                team: placement.teamName,
                                game1: teamStats[0].key.game1,
                                game2: teamStats[1].key.game2,
                                game3: teamStats[2].key.game3,
                                total:
                                    teamStats[0].key.game1 +
                                    teamStats[1].key.game2 +
                                    teamStats[2].key.game3,
                            };
                        });

                        // remove duplicates by team name
                        const table_ = table.reduce((acc: any, current: any) => {
                            const x = acc.find((item: any) => item.team === current.team);
                            if (!x) {
                                return acc.concat([current]);
                            } else {
                                return acc;
                            }
                        }, []);

                        // sort by total
                        table_.sort((a: any, b: any) => b.total - a.total);

                        const tableBuilder = new TableBuilder([
                            {
                                index: 0,
                                label: 'Team',
                                width: 20,
                                field: 'team',
                            },
                            {
                                index: 1,
                                label: 'Match #1',
                                width: 10,
                                field: 'game1',
                            },
                            {
                                index: 1,
                                label: 'Match #2',
                                width: 10,
                                field: 'game2',
                            },
                            {
                                index: 1,
                                label: 'Match #3',
                                width: 10,
                                field: 'game3',
                            },
                            {
                                index: 2,
                                label: 'Total',
                                width: 10,
                                field: 'total',
                            },
                        ]);

                        table_.forEach((row: any) => {
                            tableBuilder.addRows(row);
                        });

                        const embed1 = new EmbedBuilder({
                            title: 'Moonbane Slayers Tournament - Results',
                            description: tableBuilder.build(),
                        });
                        channel.send({
                            embeds: [embed1],
                        });
                    }
                );
            }
        );*/

        Logger.info(Logs.info.clientReady);
    }

    private onShardReady(shardId: number, _unavailableGuilds: Set<string>): void {
        Logger.setShardId(shardId);
    }

    private async onGuildJoin(guild: Guild): Promise<void> {
        if (!this.ready || Debug.dummyMode.enabled) {
            return;
        }

        try {
            await this.guildJoinHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildJoin, error);
        }
    }

    private async onGuildLeave(guild: Guild): Promise<void> {
        if (!this.ready || Debug.dummyMode.enabled) {
            return;
        }

        try {
            await this.guildLeaveHandler.process(guild);
        } catch (error) {
            Logger.error(Logs.error.guildLeave, error);
        }
    }

    private async onMessage(msg: Message): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(msg.author.id))
        ) {
            return;
        }

        try {
            msg = await PartialUtils.fillMessage(msg);
            if (!msg) {
                return;
            }

            await this.messageHandler.process(msg);
        } catch (error) {
            Logger.error(Logs.error.message, error);
        }
    }

    private async onInteraction(intr: Interaction): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(intr.user.id))
        ) {
            return;
        }

        if (intr instanceof CommandInteraction || intr instanceof AutocompleteInteraction) {
            try {
                await this.commandHandler.process(intr);
            } catch (error) {
                Logger.error(Logs.error.command, error);
            }
        } else if (intr instanceof ButtonInteraction) {
            try {
                await this.buttonHandler.process(intr);
            } catch (error) {
                Logger.error(Logs.error.button, error);
            }
        }

        // modal submit
        else if (intr.isModalSubmit()) {
            switch (intr.customId) {
                case 'signup_solo_modal':
                    new SignUpSoloModal().execute(intr);
                    break;
                case 'signup_modal':
                    new SignUpModal().execute(intr);
                    break;
                case 'signup_team_modal':
                    new SignUpTeamModal().execute(intr);
                    break;
                case 'start_tournament':
                    new StartTournamentModal().execute(intr);
                    break;
                case 'checkin_modal_response':
                    new CheckIn().execute(intr);
                    break;
                default:
                    break;
            }
        }
    }

    private async onReaction(
        msgReaction: MessageReaction | PartialMessageReaction,
        reactor: User | PartialUser
    ): Promise<void> {
        if (
            !this.ready ||
            (Debug.dummyMode.enabled && !Debug.dummyMode.whitelist.includes(reactor.id))
        ) {
            return;
        }

        try {
            msgReaction = await PartialUtils.fillReaction(msgReaction);
            if (!msgReaction) {
                return;
            }

            reactor = await PartialUtils.fillUser(reactor);
            if (!reactor) {
                return;
            }

            await this.reactionHandler.process(
                msgReaction,
                msgReaction.message as Message,
                reactor
            );
        } catch (error) {
            Logger.error(Logs.error.reaction, error);
        }
    }

    private async onRateLimit(rateLimitData: RateLimitData): Promise<void> {
        if (rateLimitData.timeToReset >= Config.logging.rateLimit.minTimeout * 1000) {
            Logger.error(Logs.error.apiRateLimit, rateLimitData);
        }
    }
}
