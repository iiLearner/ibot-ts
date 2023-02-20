import {
    ButtonInteraction,
    EmbedBuilder,
    ModalSubmitInteraction,
    resolveColor,
    TextChannel,
} from 'discord.js';
import moment from 'moment';

import { DBConnection } from '../database/connect.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { getTournamentTeams, Team } from './Team.js';

export class Tournament {
    id: number | null;
    name: string;
    userid: string;
    serverid: string;
    log_channel: string;
    role_id: string;
    main_channel: string;
    tournament_time: string;
    tournament_close: string;
    status: number;
    message_id: string;
    message_action_id: string;
    message_id_ci: string;
    mode: number;
    platform: string;
    teams_limit: number;
    subs: number;
    registration_offset: number;
    number_of_games: number;
    hero_points: boolean;
    streamer: string;
    created: string | null;
    db: DBConnection;

    constructor(
        name: string,
        userid: string,
        serverid: string,
        log_channel: string,
        main_channel: string,
        message_id: string,
        message_action_id: string,
        role_id: string,
        tournament_time: string,
        mode: number,
        platform: string,
        subs: number,
        teams_limit: number,
        registration_offset: number,
        number_of_games: number,
        hero_points: boolean,
        streamer?: string,
        id?: number,
        message_id_ci?: string,
        created?: string,
        status?: number
    ) {
        this.name = name;
        this.userid = userid;
        this.serverid = serverid;
        this.log_channel = log_channel;
        this.main_channel = main_channel;
        this.tournament_time = tournament_time;
        this.message_id = message_id;
        this.message_action_id = message_action_id;
        this.role_id = role_id;
        this.mode = mode;
        this.platform = platform;
        this.teams_limit = teams_limit;
        this.subs = subs;
        this.registration_offset = registration_offset;
        this.number_of_games = number_of_games;
        this.hero_points = hero_points;
        this.streamer = streamer || '';
        this.id = id || null;
        this.message_id_ci = message_id_ci || null;
        this.created = created || null;
        this.status = status || 1;

        // take the tournament_time and substraction the registration_offset
        this.tournament_close = moment(tournament_time, 'DD-MM-YYYY HH:mm:ss')
            .subtract(registration_offset, 'hours')
            .format('DD-MM-YYYY HH:mm:ss');

        this.db = new DBConnection();
    }

    async createTournament(server_name: string, username: string): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `INSERT INTO tournaments (name, userid, serverid, log_channel, main_channel, message_id, role_id, tournament_time, mode, streamer, platform, tournament_close, tournament_close_offset, tournament_subs, tournament_teams_limit, tournament_games, username, server_name, hero_points, message_action_id) VALUES ('${
                    this.name
                }', '${this.userid}', '${this.serverid}', '${this.log_channel}', '${
                    this.main_channel
                }', '${this.message_id}', '${this.role_id}','${this.tournament_time}', '${
                    this.mode
                }', '${this.streamer}', '${this.platform}', '${this.tournament_close}', '${
                    this.registration_offset
                }', '${this.subs}', '${this.teams_limit}', '${
                    this.number_of_games
                }', '${username}', '${server_name}', '${
                    this.hero_points ? 1 : 0
                }', '${this.message_action_id}')`;
                this.db.con.query(sql, (err, _result) => {
                    if (err) reject(err);
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async getLastTournamentInfo(): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `SELECT id, created FROM tournaments ORDER BY ID DESC LIMIT 1`;
                this.db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    this.id = result[0].id;
                    this.created = result[0].created;
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }
    isTournamentClosed(): boolean {
        const registrationClose = moment(this.tournament_time, 'DD-MM-YYYY HH:mm:ss').subtract(
            this.registration_offset || 2,
            'hours'
        );
        if (moment().isAfter(registrationClose)) {
            return true;
        }
        return false;
    }

    async tournamentClosed(intr: ModalSubmitInteraction | ButtonInteraction): Promise<void> {
        const embed = new EmbedBuilder({
            title: `${this.name} Tournament`,
            description: `The registration for this tournament has closed!`,
            footer: {
                text: 'See something wrong? Contact a moderator!',
            },
            timestamp: Date.now(),
            color: resolveColor('#fe0c03'),
        });

        await InteractionUtils.send(intr, embed, true);
    }

    async isTournamentFull(): Promise<boolean> {
        const currentTeamCount = await getTournamentTeams(this.id);
        if (currentTeamCount >= this.teams_limit) {
            return true;
        }
        return false;
    }

    async tournamentFull(intr: ModalSubmitInteraction | ButtonInteraction): Promise<void> {
        const embed = new EmbedBuilder({
            title: `${this.name} Tournament`,
            description: `Sorry! The tournament is currently at full capacity!`,
            footer: {
                text: 'See something wrong? Contact a moderator!',
            },
            timestamp: Date.now(),
            color: resolveColor('#fe0c03'),
        });
        await InteractionUtils.send(intr, embed, true);
    }

    async tournamentSuccessSolo(intr: ModalSubmitInteraction): Promise<void> {
        // send the user a messsage
        await this.sendSuccessMessage(intr);

        // solo
        if (this.mode === 1) {
            // send info message
            (intr.client.channels.cache.get(this.log_channel) as TextChannel).send({
                content: `<:like:805637215405211709> | Player \`${intr.user.tag}\` has signed up for the tournament!`,
            });

            // send message to user
            intr.user.send({
                content: `<@${intr.user.id}>! You have successfully signed up for the solo tournament!`,
            });
        }
    }

    async tournamentSuccessTeam(
        intr: ModalSubmitInteraction,
        team: Team,
        playerName: string,
        type: number,
        teamMembersNames?: string
    ): Promise<void> {
        // send the user a messsage
        await this.sendSuccessMessage(intr, team.teamCode);

        if (type === 1) {
            // send info message
            await (intr.client.channels.cache.get(this.log_channel) as TextChannel).send({
                content: `<:guud:824542470015680542> | Player \`${intr.user.tag}\` has joined the team \`${team.teamName}\`!`,
            });

            // send message to user
            await intr.user.send({
                content: `<@${intr.user.id}>! You have successfully joined the team \`${team.teamName}\` for the tournament! Find below your team details\`\`\`Team name: ${team.teamName}\nTeam captain: ${team.teamLeader}\nTeam Code: ${team.teamCode}\nTeam Members: ${teamMembersNames}\`\`\`Share the team code with your teammates so they can join your team!`,
            });

            // send message to team leader
            const teamLeader = await intr.client.users.fetch(team.teamLeaderId);
            await teamLeader.send({
                content: `<@${team.teamLeaderId}>! Player \`${intr.user.tag} (${playerName})\` has joined your team \`${team.teamName}\`! Find below your team details\`\`\`Team name: ${team.teamName}\nTeam captain: ${team.teamLeader}\nTeam Code: ${team.teamCode}\nTeam Members: ${teamMembersNames}\nTournament Time: ${this.tournament_time}\`\`\`Share the team code with your teammates so they can join your team!`,
            });
        } else {
            // send info message
            (intr.client.channels.cache.get(this.log_channel) as TextChannel).send({
                content: `<:guud:824542470015680542> | Team Leader \`${intr.user.tag}\` has signed up for the tournament with team \`${team.teamName}\`!`,
            });

            // send message to user
            intr.user.send({
                content: `<@${intr.user.id}>! You have successfully signed up for the tournament! Find below your tournament details\`\`\`Team name: ${team.teamName}\nTeam captain: ${intr.user.tag}\nTeam Code: ${team.teamCode}\nTournament Time: ${this.tournament_time}\`\`\`Share the team code with your teammates so they can join your team!`,
            });
        }
    }

    private async sendSuccessMessage(
        intr: ModalSubmitInteraction,
        teamCode?: string
    ): Promise<void> {
        // send the user a messsage
        const embed = new EmbedBuilder({
            title: `${this.name} Tournament - Registration`,
            description: `You have successfully signed up for the tournament${
                teamCode
                    ? '\nTeam Code: `' +
                      teamCode +
                      '`\nShare the team code with your teammates so they can join your team!'
                    : ''
            }`,
            footer: {
                text: 'You will be notified when the tournament starts!',
            },
            timestamp: Date.now(),
            color: resolveColor('#008080'),
        });

        await InteractionUtils.send(intr, embed, true);
    }

    async updateTournamentStatus(status: number): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const db = new DBConnection();
                const sql = `UPDATE tournaments SET status = ${status} WHERE ID = ${this.id}`;
                db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async updateTournamentCi(ci: string): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const db = new DBConnection();
                const sql = `UPDATE tournaments SET message_id_ci = ${ci} WHERE ID = ${this.id}`;
                db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

export async function getTournamentByMessage(message_id: string): Promise<Tournament> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM tournaments WHERE message_id = '${message_id}' OR message_id_ci = '${message_id}' OR message_action_id = '${message_id}' LIMIT 1`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    reject('No tournament found');
                    return;
                }
                const tourney = new Tournament(
                    result[0].name,
                    result[0].userid,
                    result[0].serverid,
                    result[0].log_channel,
                    result[0].main_channel,
                    result[0].message_id,
                    result[0].message_action_id,
                    result[0].role_id,
                    result[0].tournament_time,
                    result[0].mode,
                    result[0].platform,
                    result[0].tournament_subs,
                    result[0].tournament_teams_limit,
                    result[0].tournament_close_offset,
                    result[0].tournament_games,
                    result[0].hero_points == 1 ? true : false,
                    result[0].streamer,
                    result[0].ID,
                    result[0].message_id_ci,
                    result[0].created
                );
                resolve(tourney);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTournamentsByStatus(status: number): Promise<Tournament[]> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM tournaments WHERE status = ${status}`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    resolve([]);
                    return;
                }
                const tourneys = result.map(
                    tournament =>
                        new Tournament(
                            tournament.name,
                            tournament.userid,
                            tournament.serverid,
                            tournament.log_channel,
                            tournament.main_channel,
                            tournament.message_id,
                            tournament.message_action_id,
                            tournament.role_id,
                            tournament.tournament_time,
                            tournament.mode,
                            tournament.platform,
                            tournament.tournament_subs,
                            tournament.tournament_teams_limit,
                            tournament.tournament_close_offset,
                            tournament.tournament_games,
                            result[0].hero_points == 1 ? true : false,
                            tournament.streamer,
                            tournament.ID,
                            tournament.message_id_ci,
                            tournament.created,
                            tournament.status
                        )
                );
                resolve(tourneys);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function sendErrorMessage(intr: any, error: any): Promise<void> {
    const embed = new EmbedBuilder({
        title: `An error occured!`,
        description: `An unknown error happened, please report to the dev:  ${error}`,
        footer: {
            text: 'Need help? Contact a moderator!',
        },
        timestamp: Date.now(),
        color: resolveColor('#fe0c03'),
    });
    await InteractionUtils.send(intr, embed, true);
}
