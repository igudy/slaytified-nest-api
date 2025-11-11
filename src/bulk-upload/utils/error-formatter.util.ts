// Error Formatter Utility - formats validation errors
// Helps create consistent error messages throughout the application

import { IFieldError } from '../interfaces/validation-result.interface';

export class ErrorFormatterUtil {
  /**
   * Formats a field error with a consistent structure
   */
  static formatFieldError(field: string, message: string, code?: string): IFieldError {
    return {
      field,
      message,
      code: code || 'VALIDATION_ERROR',
    };
  }

  /**
   * Creates a required field error
   */
  static requiredFieldError(field: string): IFieldError {
    return this.formatFieldError(
      field,
      `${field} is required`,
      'REQUIRED',
    );
  }

  /**
   * Creates an invalid format error
   */
  static invalidFormatError(field: string, expectedFormat?: string): IFieldError {
    const message = expectedFormat
      ? `${field} has invalid format. Expected: ${expectedFormat}`
      : `${field} has invalid format`;

    return this.formatFieldError(field, message, 'INVALID_FORMAT');
  }

  /**
   * Creates a duplicate value error
   */
  static duplicateError(field: string): IFieldError {
    return this.formatFieldError(
      field,
      `${field} already exists in the system`,
      'DUPLICATE',
    );
  }

  /**
   * Creates an invalid range error
   */
  static rangeError(field: string, min?: number, max?: number): IFieldError {
    let message = `${field} is out of range`;

    if (min !== undefined && max !== undefined) {
      message = `${field} must be between ${min} and ${max}`;
    } else if (min !== undefined) {
      message = `${field} must be at least ${min}`;
    } else if (max !== undefined) {
      message = `${field} must be at most ${max}`;
    }

    return this.formatFieldError(field, message, 'RANGE_ERROR');
  }

  /**
   * Creates an invalid reference error (for foreign keys)
   */
  static invalidReferenceError(field: string, referenceType: string): IFieldError {
    return this.formatFieldError(
      field,
      `${field} references a non-existent ${referenceType}`,
      'INVALID_REFERENCE',
    );
  }

  /**
   * Formats multiple errors into a readable string
   */
  static formatErrorsToString(errors: IFieldError[]): string {
    return errors.map(e => `${e.field}: ${e.message}`).join(', ');
  }
}
