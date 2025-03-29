import { HttpStatus } from '@nestjs/common';
import {
  ResourceNotFoundException,
  ValidationFailedException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '../../../src/common/exceptions/custom-exceptions';

describe('Custom Exceptions', () => {
  it('should create ResourceNotFoundException with correct status and message', () => {
    const exception = new ResourceNotFoundException('User', 123);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toBe("User with id '123' not found");
  });

  it('should create ResourceNotFoundException without id', () => {
    const exception = new ResourceNotFoundException('Users');
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(exception.message).toBe("Users not found");
  });

  it('should create ValidationFailedException with errors object', () => {
    const errors = { name: ['Name is required'] };
    const exception = new ValidationFailedException(errors);
    expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    
    const response = exception.getResponse() as any;
    expect(response.message).toBe('Validation failed');
    expect(response.errors).toEqual(errors);
  });

  it('should create UnauthorizedException', () => {
    const exception = new UnauthorizedException();
    expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(exception.message).toBe('Unauthorized');
  });

  it('should create ForbiddenException', () => {
    const exception = new ForbiddenException();
    expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(exception.message).toBe('Forbidden');
  });

  it('should create ConflictException', () => {
    const exception = new ConflictException('User', 'email', 'test@example.com');
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(exception.message).toBe("User with email 'test@example.com' already exists");
  });

  it('should create InternalServerErrorException', () => {
    const exception = new InternalServerErrorException();
    expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(exception.message).toBe('Internal server error');
  });
});
