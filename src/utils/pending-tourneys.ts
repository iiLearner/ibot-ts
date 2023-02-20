let instance = null;
export class PendingTournys {
    // singleton
    private pendingTournaments: Map<string, object> = new Map();
    constructor() {
        // Singleton
        if (instance) {
            return instance;
        }
        instance = this;
    }

    // a map with key/value containing the tournament id and the tournament object

    // add a tournament to the map
    addTournament(tournamentId: string, tournament: object): void {
        // remove all the tournaments with the same id
        this.pendingTournaments.forEach((_value, key) => {
            if (key === tournamentId) {
                this.removeTournament(key);
            }
        });
        // add the tournament to the map
        this.pendingTournaments.set(tournamentId, tournament);

        // remove the tournament from the map after 3 minutes
        setTimeout(() => {
            this.removeTournament(tournamentId);
        }, 180000);
    }

    // remove a tournament from the map
    removeTournament(tournamentId: string): void {
        this.pendingTournaments.delete(tournamentId);
    }

    // get a tournament from the map
    getTournament(tournamentId: string): object {
        return this.pendingTournaments.get(tournamentId);
    }

    // get all tournaments from the map
    getAllTournaments(): Map<string, object> {
        return this.pendingTournaments;
    }

    // check if a tournament is in the map
    hasTournament(tournamentId: string): boolean {
        return this.pendingTournaments.has(tournamentId);
    }
}
