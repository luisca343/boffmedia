import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

@Injectable()
export class ResponseService {
  constructor(private readonly logger: Logger) {}

  logRequest(_action: string, _data: any) {
    //this.logger.log(`${_action} data:`, _data);
  }

  logSuccess(_action: string, _data: any) {
    //this.logger.log(`${_action} successfully:`, _data);
  }

  createSuccessResponse(message: string, data: any) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message,
      data,
    };
  }

  handleError(action: string, error: any, _data?: any) {
    this.logger.error(`Failed to ${action}:`, error.message);
    throw new HttpException(
      {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Failed to ${action}`,
        error: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
