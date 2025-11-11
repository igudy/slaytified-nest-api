// User Validator - validates user data
// This validates each user row from the Excel file

import { Injectable } from '@nestjs/common';
import { IUserRow } from '../interfaces/bulk-upload.interface';
import { IFieldError, IValidationResult } from '../interfaces/validation-result.interface';
import { ErrorFormatterUtil } from '../utils/error-formatter.util';

@Injectable()
export class UserValidator {
  // Valid roles in the system
  private readonly validRoles = ['admin', 'user', 'manager'];

  /**
   * Validates a single user row
   */
  validate(data: any, rowNumber: number): IValidationResult {
    const errors: IFieldError[] = [];

    // Validate Email (required, valid format)
    if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('email'));
    } else if (!this.isValidEmail(data.email)) {
      errors.push(ErrorFormatterUtil.invalidFormatError('email', 'valid email address'));
    }

    // Validate First Name (required, string)
    if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('firstName'));
    } else if (data.firstName.length > 100) {
      errors.push(
        ErrorFormatterUtil.formatFieldError(
          'firstName',
          'First name must be less than 100 characters',
          'MAX_LENGTH',
        ),
      );
    }

    // Validate Last Name (required, string)
    if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('lastName'));
    } else if (data.lastName.length > 100) {
      errors.push(
        ErrorFormatterUtil.formatFieldError(
          'lastName',
          'Last name must be less than 100 characters',
          'MAX_LENGTH',
        ),
      );
    }

    // Validate Role (required, must be in valid roles list)
    if (!data.role || typeof data.role !== 'string' || data.role.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('role'));
    } else if (!this.validRoles.includes(data.role.toLowerCase())) {
      errors.push(
        ErrorFormatterUtil.formatFieldError(
          'role',
          `Role must be one of: ${this.validRoles.join(', ')}`,
          'INVALID_VALUE',
        ),
      );
    }

    // Validate Phone Number (optional, but must be valid if provided)
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      if (!this.isValidPhoneNumber(data.phoneNumber)) {
        errors.push(
          ErrorFormatterUtil.invalidFormatError(
            'phoneNumber',
            'valid phone number (e.g., +1234567890)',
          ),
        );
      }
    }

    return {
      rowNumber,
      isValid: errors.length === 0,
      data: this.sanitizeData(data),
      errors,
    };
  }

  /**
   * Validates multiple user rows
   */
  validateBatch(users: any[]): IValidationResult[] {
    return users.map((user, index) =>
      this.validate(user, index + 2) // +2 because row 1 is headers, Excel is 1-indexed
    );
  }

  /**
   * Validates email format using regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates phone number format
   * Accepts formats like: +1234567890, 1234567890, (123) 456-7890
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // Check if it's a valid length (10-15 digits with optional +)
    return /^\+?\d{10,15}$/.test(cleaned);
  }

  /**
   * Sanitizes and normalizes user data
   */
  private sanitizeData(data: any): IUserRow {
    return {
      email: data.email?.trim().toLowerCase() || '',
      firstName: data.firstName?.trim() || '',
      lastName: data.lastName?.trim() || '',
      role: data.role?.trim().toLowerCase() || '',
      phoneNumber: data.phoneNumber?.trim() || undefined,
    };
  }
}
