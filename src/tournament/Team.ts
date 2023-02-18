import { EmbedBuilder, ModalSubmitInteraction, resolveColor } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';

import { DBConnection } from '../database/connect.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { Player } from './Player.js';
import { Tournament } from './Tournament.js';

export class Team {
    teamId: number | null;
    tID: number;
    teamName: string;
    teamLeader: string;
    teamLeaderId: string;
    teamStatus: number;
    teamCode: string;
    teamAvatar: string;
    db: DBConnection;

    constructor(
        teamName: string,
        teamLeader: string,
        teamLeaderId: string,
        tID: number,
        teamAvatar: string,
        teamStatus?: number,
        teamCode?: string,
        teamId?: number
    ) {
        this.teamName = teamName;
        this.teamLeader = teamLeader;
        this.teamLeaderId = teamLeaderId;
        this.tID = tID;
        this.teamAvatar = teamAvatar;
        this.teamStatus = teamStatus ? teamStatus : 1;
        this.teamId = teamId ? teamId : null;
        this.teamCode = teamCode
            ? (this.teamCode = teamCode)
            : (this.teamCode = uuidv4().substring(0, 6));
        this.db = new DBConnection();
    }

    async createTeam(): Promise<void> {
        try {
            const sql = `INSERT INTO teams (teamName, teamLeader, tID, teamCode, teamLeaderId, teamAvatar) VALUES ('${this.teamName}', '${this.teamLeader}', ${this.tID}, '${this.teamCode}', '${this.teamLeaderId}', '${this.teamAvatar}')`;
            await this.db.con.query(sql);
        } catch (err) {
            console.log(err);
        }
    }

    async getLastTeamInfo(): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `SELECT teamID FROM teams ORDER BY teamID DESC LIMIT 1`;
                this.db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    this.teamId = result[0].teamID;
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async isTeamNameTaken(): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `SELECT * FROM teams WHERE teamName = '${this.teamName}' AND tID = '${this.tID}'`;
                this.db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    if (result.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async teamNameTaken(intr: ModalSubmitInteraction, tournament: Tournament): Promise<void> {
        const embed = new EmbedBuilder({
            title: `${tournament.name} Tournament`,
            description: `The team name \`${this.teamName}\` is already taken, please try again with a different name.`,
            footer: {
                text: 'See something wrong? Contact a moderator!',
            },
            timestamp: Date.now(),
            color: resolveColor('#fe0c03'),
        });

        await InteractionUtils.send(intr, embed, true);
    }

    async isPlayerInTeam(): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            try {
                const sql = `SELECT * FROM teams, players WHERE tID = '${this.tID}' AND players.teamID = teams.teamID AND players.userid = '${this.teamLeaderId}'`;
                this.db.con.query(sql, (err, result) => {
                    if (err) reject(err);
                    if (result.length > 0) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    async playerInTeam(intr: ModalSubmitInteraction, tournament: Tournament): Promise<void> {
        const embed = new EmbedBuilder({
            title: `${tournament} Tournament`,
            description: `You have already signed up for the tournament!`,
            footer: {
                text: 'See something wrong? Contact a moderator!',
            },
            timestamp: Date.now(),
            color: resolveColor('#fe0c03'),
        });
        await InteractionUtils.send(intr, embed, true);
    }

    isTeamFull(tournament: Tournament, teamMembers: Player[]): boolean {
        if (tournament.mode === 1) {
            if (teamMembers.length > 1) {
                return true;
            }
        } else if (tournament.mode === 2) {
            if (teamMembers.length > 2 + tournament.subs) {
                return true;
            }
        } else if (tournament.mode === 3) {
            if (teamMembers.length > 3 + tournament.subs) {
                return true;
            }
        }
        return false;
    }

    async teamFull(
        intr: ModalSubmitInteraction,
        tournament: Tournament,
        teamName: string
    ): Promise<void> {
        const embed = new EmbedBuilder({
            title: `${tournament.name} Tournament`,
            description: `The team ${teamName} is already full!`,
            footer: {
                text: "think it's a mistake? Contact a moderator!",
            },
            timestamp: Date.now(),
            color: resolveColor('#fe0c03'),
        });
        await InteractionUtils.send(intr, embed, true);
    }

    async updateTeamStatus(status: number, selection: string): Promise<void> {
        return await new Promise((resolve, reject) => {
            try {
                const db = new DBConnection();
                const sql = `UPDATE teams SET teamStatus = ${status}, teamSelection = '${selection}' WHERE teamID = ${this.teamId}`;
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

export async function getTeamByCode(code: string): Promise<Team> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM teams WHERE teamCode = '${code}' LIMIT 1`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    reject('Specified team could not be found!');
                    return;
                }
                const team = new Team(
                    result[0].teamName,
                    result[0].teamLeader,
                    result[0].teamLeaderId,
                    result[0].tID,
                    result[0].teamAvatar,
                    result[0].teamStatus,
                    result[0].teamCode,
                    result[0].teamID
                );
                resolve(team);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTeamMembers(code: string): Promise<Player[]> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM players, teams WHERE teamCode = '${code}' AND players.teamID = teams.teamID`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    resolve([]);
                    return;
                }
                const players = result.map(team => {
                    return new Player(
                        team.userid,
                        team.username,
                        team.playerName,
                        team.ig_id,
                        team.teamID
                    );
                });
                resolve(players);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTournamentTeams(tournament_id: number): Promise<number> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT COUNT(*) AS teamCount FROM teams WHERE tID = '${tournament_id}'`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    resolve(0);
                    return;
                }
                resolve(result[0].teamCount);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTournamentTeams_Ex(tournament_id: number): Promise<Team[]> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM teams WHERE tID = '${tournament_id}'`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result[0] === undefined) {
                    resolve([]);
                    return;
                }
                const teams = result.map(team => {
                    return new Team(
                        team.teamName,
                        team.teamLeader,
                        team.teamLeaderId,
                        team.tID,
                        team.teamAvatar,
                        team.teamStatus,
                        team.teamCode,
                        team.teamID
                    );
                });
                resolve(teams);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTournamentTeamsDetailed(tournament_id: number): Promise<unknown> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT players.userid, players.ig_name, players.username, teams.teamName, teams.teamStatus FROM players, teams WHERE teams.teamID = players.teamID AND teams.tID = '${tournament_id}' ORDER BY players.ID`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (typeof result == undefined || result[0] === undefined) {
                    resolve(null);
                    return;
                }
                const teams = result.map(team => {
                    // group by teamName
                    return {
                        teamName: team.teamName,
                        teamStatus: team.teamStatus,
                        players: result
                            .filter(player => player.teamName === team.teamName)
                            .map(player => {
                                return {
                                    userid: player.userid,
                                    ig_name: player.ig_name,
                                    username: player.username,
                                };
                            }),
                    };
                });

                // remove duplicates
                const uniqueTeams = teams.filter((team, index, self) => {
                    return index === self.findIndex(t => t.teamName === team.teamName);
                });

                resolve(uniqueTeams);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function getTeamByUserId(userid: string, tournament_id: number): Promise<Team> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `SELECT * FROM teams, players WHERE players.userid = '${userid}' AND players.teamID = teams.teamID AND teams.tID = '${tournament_id}' LIMIT 1`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                if (result.length === 0 || result[0] === undefined) {
                    resolve(null);
                    return;
                }

                const team = new Team(
                    result[0].teamName,
                    result[0].teamLeader,
                    result[0].teamLeaderId,
                    result[0].tID,
                    result[0].teamAvatar,
                    result[0].teamStatus,
                    result[0].teamCode,
                    result[0].teamID
                );
                resolve(team);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function removePlayerFromTeam(userid: string, team_id: number): Promise<void> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `DELETE FROM players WHERE players.userid = '${userid}' AND teamID = '${team_id}' LIMIT 1`;
            db.con.query(sql, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        } catch (err) {
            resolve(err);
        }
    });
}

export async function removeTeam(team_id: number): Promise<void> {
    return await new Promise((resolve, reject) => {
        try {
            const db = new DBConnection();
            const sql = `DELETE FROM players WHERE teamID = '${team_id}'`;
            db.con.query(sql, (err, _result) => {
                if (err) reject(err);
                const sql2 = `DELETE FROM teams WHERE teamID = '${team_id}'`;
                db.con.query(sql2, (err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
            });
        } catch (err) {
            console.log(err);
        }
    });
}
