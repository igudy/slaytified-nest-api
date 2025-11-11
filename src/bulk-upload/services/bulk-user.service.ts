// Bulk User Service - handles bulk user operations
// Processes validated user data and inserts into database

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IValidationResult } from '../interfaces/validation-result.interface';
import { IUploadedRecord, IFailedRecord } from '../interfaces/bulk-upload.interface';
import { ErrorFormatterUtil } from '../utils/error-formatter.util';
import { User } from '../../users/schemas/user.schema/user.schema';

@Injectable()
export class BulkUserService {
  private readonly logger = new Logger(BulkUserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  /**
   * Processes bulk user upload
   * Uses partial success approach
   */
  async processBulkUpload(
    validatedRows: IValidationResult[],
  ): Promise<{
    successful: IUploadedRecord[];
    failed: IFailedRecord[];
  }> {
    const successful: IUploadedRecord[] = [];
    const failed: IFailedRecord[] = [];

    const validRows = validatedRows.filter(row => row.isValid);
    const invalidRows = validatedRows.filter(row => !row.isValid);

    // Add validation failures to failed array
    invalidRows.forEach(row => {
      failed.push({
        rowNumber: row.rowNumber,
        data: row.data,
        errors: row.errors,
      });
    });

    // Process valid rows
    for (const row of validRows) {
      try {
        // Check for duplicate email
        const existingUser = await this.checkDuplicateEmail(row.data.email);

        if (existingUser) {
          failed.push({
            rowNumber: row.rowNumber,
            data: row.data,
            errors: [ErrorFormatterUtil.duplicateError('email')],
          });
          continue;
        }

        // Create user
        // Note: In production, you'd also need to:
        // 1. Hash a default password or send invitation email
        // 2. Set user status (active/pending)
        // 3. Send welcome email
        const user = await this.createUser(row.data);

        successful.push({
          rowNumber: row.rowNumber,
          data: row.data,
          id: user._id?.toString(),
        });

        this.logger.log(`Successfully created user: ${row.data.email}`);
      } catch (error) {
        this.logger.error(`Failed to create user at row ${row.rowNumber}: ${error.message}`);

        failed.push({
          rowNumber: row.rowNumber,
          data: row.data,
          errors: [
            ErrorFormatterUtil.formatFieldError(
              'database',
              `Failed to create: ${error.message}`,
              'DATABASE_ERROR',
            ),
          ],
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Checks if a user with the given email already exists
   */
  private async checkDuplicateEmail(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  /**
   * Creates a new user in the database
   * Note: In production, you should:
   * 1. Generate a secure random password or send an invitation email
   * 2. Hash the password using bcrypt
   * 3. Send a welcome/setup email to the user
   */
  private async createUser(userData: any): Promise<any> {
    // For now, we'll create users without passwords
    // You should add password generation and email sending logic here
    const user = new this.userModel({
      ...userData,
      // password: await this.hashPassword(this.generateRandomPassword()),
    });
    return await user.save();
  }

  /**
   * Generate random password (implement this if needed)
   */
  // private generateRandomPassword(): string {
  //   return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  // }

  /**
   * Hash password helper (implement based on your auth strategy)
   */
  // private async hashPassword(password: string): Promise<string> {
  //   const bcrypt = require('bcrypt');
  //   return await bcrypt.hash(password, 10);
  // }
}
