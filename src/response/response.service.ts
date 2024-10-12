import { Injectable, HttpStatus, HttpException, Logger } from '@nestjs/common';

@Injectable()
export class ResponseService {
  constructor(private readonly logger: Logger) {}

  logRequest(action: string, data: any) {
    //this.logger.log(`${action} data:`, data);
  }

  logSuccess(action: string, data: any) {
    //this.logger.log(`${action} successfully:`, data);
  }

  createSuccessResponse(message: string, data: any) {
    return {
      statusCode: HttpStatus.CREATED,
      message,
      data,
    };
  }

  handleError(action: string, error: any, data?: any) {
    this.logger.error(`Failed to ${action}:`, error.message);
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to ${action}`,
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}