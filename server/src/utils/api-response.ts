class ApiResponse<T = unknown> {
    statusCode: number;
    data: T;
    success: boolean;
    message: string;

    constructor(statusCode: number, data: T, message: string = 'Success') {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
