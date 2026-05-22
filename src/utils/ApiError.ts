class ApiError extends Error {
    statusCode: number;

    code: string;

    errors: any[];

    isOperational: boolean;

    constructor(
        statusCode: number,

        message: string,

        options?: {
            code?: string;

            errors?: any[];

            isOperational?: boolean;
        } 
    ) {
        super(message);

        this.statusCode = statusCode;

        this.code =
            options?.code ||
            "INTERNAL_SERVER_ERROR";

        this.errors =
            options?.errors || [];

        this.isOperational =
            options?.isOperational ?? true;

        Error.captureStackTrace(
            this,
            this.constructor
        );
    }
}

export default ApiError;