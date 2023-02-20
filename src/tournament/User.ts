import { DBConnection } from '../database/connect.js';

export class User {
    userid: string;
    game_id: string;
    game_name: string;

    constructor(userid: string, game_id: string, game_name: string) {
        this.userid = userid;
        this.game_id = game_id;
        this.game_name = game_name;
    }

    async updateOrCreateUser(): Promise<void> {
        const db = new DBConnection();
        try {
            // check if user exists
            const sql = `SELECT * FROM users WHERE userid = '${this.userid}'`;
            const result = await db.con.query(sql);

            // if user exists, update
            if (result && result[0]?.length > 0) {
                const sql2 = `UPDATE users SET game_id = '${this.game_id}', game_name = '${this.game_name}' WHERE userid = '${this.userid}'`;
                await db.con.query(sql2);
            } else {
                // if user does not exist, insert
                const sql3 = `INSERT INTO users (userid, game_id, game_name) VALUES ('${this.userid}', '${this.game_id}', '${this.game_name}')`;
                await db.con.query(sql3);
            }
        } catch {
            return;
        }
    }
}

export const getPlayerByUserId = async (userid: string): Promise<User> => {
    const db = new DBConnection();
    return await new Promise((resolve, _reject) => {
        db.con.query(`SELECT * FROM users WHERE userid = ${userid}`, (err, player) => {
            if (err) resolve(null);
            try {
                const user = new User(player[0].userid, player[0].game_id, player[0].game_name);
                resolve(user);
            } catch (error) {
                resolve(null);
            }
        });
    });
};
