class ErrorMessageDto {
    // Fields of the DTO
    code: number;
    message: string;
    timestamp: Date;

    // Constructor to initialize fields
    constructor(code: number, message: string, timestamp: Date) {
        this.code = code;
        this.message = message;
        this.timestamp = timestamp;
    }
}

export { ErrorMessageDto }