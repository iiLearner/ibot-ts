import { DBConnection } from '../database/connect.js';

export class Tournament {
    id: number | null;
    name: string;
    userid: string;
    serverid: string;
    log_channel: string;
    role_id: string;
    main_channel: string;
    tournament_time: string;
    status: number;
    message_id: string;
    message_id_ci: string;
    mode: number;
    created: string | null;
    db: DBConnection;

    constructor(
        name: string,
        userid: string,
        serverid: string,
        log_channel: string,
        main_channel: string,
        message_id: string,
        role_id: string,
        tournament_time: string,
        mode: number,
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
        this.role_id = role_id;
        this.mode = mode;
        this.id = id || null;
        this.message_id_ci = message_id_ci || null;
        this.created = created || null;
        this.status = status || 1;
        this.db = new DBConnection();
    }

    async createTournament(): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `INSERT INTO tournaments (name, userid, serverid, log_channel, main_channel, message_id, role_id, tournament_time, mode) VALUES ('${this.name}', '${this.userid}', '${this.serverid}', '${this.log_channel}', '${this.main_channel}', '${this.message_id}', '${this.role_id}','${this.tournament_time}', '${this.mode}')`;
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
}

export async function updateTournamentStatus(tournament: number, status: number): Promise<void> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `UPDATE tournaments SET status = ${status} WHERE ID = ${tournament}`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        } catch (err) {
            reject(err);
        }
    });
}

export async function updateTournamentCi(tournament: number, ci: string): Promise<void> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `UPDATE tournaments SET message_id_ci = ${ci} WHERE ID = ${tournament}`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        } catch (err) {
            reject(err);
        }
    });
}

export async function getTournamentByMessage(message_id: string): Promise<Tournament> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM tournaments WHERE message_id = '${message_id}' OR message_id_ci = '${message_id}' LIMIT 1`;
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
                    result[0].role_id,
                    result[0].tournament_time,
                    result[0].mode,
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
                            tournament.role_id,
                            tournament.tournament_time,
                            tournament.mode,
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
