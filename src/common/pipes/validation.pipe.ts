import { ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationFailedException } from '../exceptions/custom-exceptions';

export const createValidationPipe = () => {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (validationErrors: ValidationError[] = []) => {
      const errors = formatValidationErrors(validationErrors);
      return new ValidationFailedException(errors);
    },
  });
};

function formatValidationErrors(
  validationErrors: ValidationError[],
  parentField = '',
): Record<string, any> {
  return validationErrors.reduce((acc, error) => {
    const field = parentField ? `${parentField}.${error.property}` : error.property;
    
    if (error.constraints) {
      acc[field] = Object.values(error.constraints);
    }
    
    if (error.children && error.children.length > 0) {
      const nestedErrors = formatValidationErrors(error.children, field);
      Object.assign(acc, nestedErrors);
    }
    
    return acc;
  }, {} as Record<string, any>);
}