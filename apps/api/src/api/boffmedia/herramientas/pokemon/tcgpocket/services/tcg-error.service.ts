import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class TcgErrorService {
  handleApiError(error: any, operation: string): never {
    if (error.response?.status === 404) {
      throw new HttpException(
        `${operation}: Resource not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (error.response?.status >= 400 && error.response?.status < 500) {
      throw new HttpException(
        `${operation}: Client error - ${error.message}`,
        error.response.status,
      );
    }

    if (error.response?.status >= 500) {
      throw new HttpException(
        `${operation}: External API error`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    throw new HttpException(
      `${operation}: An unexpected error occurred`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  handleDatabaseError(error: any, operation: string): never {
    throw new HttpException(
      `${operation}: Database operation failed`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  validateSeriesId(seriesId: string): void {
    if (!seriesId || seriesId.trim().length === 0) {
      throw new HttpException(
        'Series ID is required and cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  validateSetId(setId: string): void {
    if (!setId || setId.trim().length === 0) {
      throw new HttpException(
        'Set ID is required and cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  validateLocale(locale: string): void {
    const validLocales = ['en', 'es'];
    if (!validLocales.includes(locale)) {
      throw new HttpException(
        `Invalid locale. Supported locales: ${validLocales.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
