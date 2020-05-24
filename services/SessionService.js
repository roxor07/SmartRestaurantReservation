class SessionService {
    constructor() {
        this.sessions = {};
        this.timeToLive = 5 * 60;
    }
    static now() {
        return Math.floor(new Date() / 1000);
    }

    create(sessionId) {
        this.clearExpiredSessions();
        this.sessions[sessionId] = {
            timestamp: SessionService.now(),
            context: {}
        }
        return this.sessions[sessionId];
    }

    get(sessionId) {
        this.clearExpiredSessions();
        if (!this.sessions[sessionId]) return false;
        this.update(sessionId);
        return this.sessions[sessionId];
    }

    update(sessionId) {
        this.clearExpiredSessions();
        if (!this.sessions[sessionId]) return false;
        this.sessions[sessionId].timestamp = SessionService.now();
        return this.sessions[sessionId];
    }

    delete(sessionId) {
        if (this.sessions[sessionId]) delete this.sessions[sessionId];
        return true;
    }

    clearExpiredSessions() {
        Object.keys(this.sessions).forEach(key => {
            const session = this.sessions[key];
            if (session.timestamp + this.timeToLive < SessionService.now()) {
                this.delete(key);
            }
        });
        return true;
    }
}

module.exports = SessionService;