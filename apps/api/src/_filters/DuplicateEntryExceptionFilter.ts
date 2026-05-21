import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class DuplicateEntryExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.message.includes('Duplicate entry')) {
      // Extract the column name from the error message
      const columnName = exception.message.split('for key')[1];

      response.status(409).json({
        statusCode: 409,
        message: `Duplicate entry for column ${columnName}`,
      });
    } else {
      // handle other database errors, or throw the original error
      throw exception;
    }
  }
}
