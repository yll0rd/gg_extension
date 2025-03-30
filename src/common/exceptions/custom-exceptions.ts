import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, id?: string | number) {
    const message = id 
      ? `${resource} with id '${id}' not found` 
      : `${resource} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ValidationFailedException extends HttpException {
  constructor(errors: Record<string, any>) {
    super(
      {
        message: 'Validation failed',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ConflictException extends HttpException {
  constructor(resource: string, field: string, value: string) {
    super(
      `${resource} with ${field} '${value}' already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message: string = 'Internal server error') {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}