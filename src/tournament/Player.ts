import { DBConnection } from '../database/connect.js';
import { User } from './User.js';

export class Player {
    id: number | undefined;
    userid: string;
    username: string;
    teamID: number;
    codeStatus = 0;
    ig_name: string;
    ig_id: string;
    db: DBConnection;
    constructor(userid: string, username: string, ig_name: string, ig_id: string, teamID: number) {
        this.userid = userid;
        this.username = username;
        this.teamID = teamID;
        this.ig_name = ig_name;
        this.ig_id = ig_id;
        this.db = new DBConnection();
    }

    async createPlayer(): Promise<void> {
        try {
            const sql = `INSERT INTO players (userid, username, teamID, ig_name, ig_id) VALUES ('${this.userid}', '${this.username}', '${this.teamID}', '${this.ig_name}', '${this.ig_id}')`;
            await this.db.con.query(sql);
        } catch (err) {
            console.log(err);
        }

        // update insert into users
        const user = new User(this.userid, this.ig_id, this.ig_name);
        await user.updateOrCreateUser();
    }
}
