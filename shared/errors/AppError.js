export class AppError extends Error {
    constructor(msg, status = 500) {
        super(msg);
        this.name = 'AppError';
        this.status = status;
        this.msg = msg;
    }
}
