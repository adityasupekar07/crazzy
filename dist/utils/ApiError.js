class ApiError extends Error {
    statusCode;
    code;
    errors;
    isOperational;
    constructor(statusCode, message, options) {
        super(message);
        this.statusCode = statusCode;
        this.code =
            options?.code ||
                "INTERNAL_SERVER_ERROR";
        this.errors =
            options?.errors || [];
        this.isOperational =
            options?.isOperational ?? true;
        Error.captureStackTrace(this, this.constructor);
    }
}
export default ApiError;
