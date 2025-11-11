// Bulk Product Service - handles bulk product operations
// Processes validated product data and inserts into database

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IValidationResult } from '../interfaces/validation-result.interface';
import { IUploadedRecord, IFailedRecord } from '../interfaces/bulk-upload.interface';
import { ErrorFormatterUtil } from '../utils/error-formatter.util';
import { Product } from '../../products/schemas/product.schema/product.schema';

@Injectable()
export class BulkProductService {
  private readonly logger = new Logger(BulkProductService.name);

  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>
  ) {}

  /**
   * Processes bulk product upload
   * Uses partial success approach - processes each row individually
   * Returns both successful and failed records
   */
  async processBulkUpload(
    validatedRows: IValidationResult[],
  ): Promise<{
    successful: IUploadedRecord[];
    failed: IFailedRecord[];
  }> {
    const successful: IUploadedRecord[] = [];
    const failed: IFailedRecord[] = [];

    // Separate valid and invalid rows
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

    // Process valid rows one by one
    // Using for...of to handle async operations sequentially
    for (const row of validRows) {
      try {
        // Check for duplicate SKU in database
        const existingProduct = await this.checkDuplicateSKU(row.data.sku);

        if (existingProduct) {
          failed.push({
            rowNumber: row.rowNumber,
            data: row.data,
            errors: [ErrorFormatterUtil.duplicateError('SKU')],
          });
          continue;
        }

        // Insert product into database
        const product = await this.createProduct(row.data);

        successful.push({
          rowNumber: row.rowNumber,
          data: row.data,
          id: product._id?.toString(),
        });

        this.logger.log(`Successfully inserted product: ${row.data.sku}`);
      } catch (error) {
        this.logger.error(`Failed to insert product at row ${row.rowNumber}: ${error.message}`);

        failed.push({
          rowNumber: row.rowNumber,
          data: row.data,
          errors: [
            ErrorFormatterUtil.formatFieldError(
              'database',
              `Failed to insert: ${error.message}`,
              'DATABASE_ERROR',
            ),
          ],
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Checks if a product with the given SKU already exists
   */
  private async checkDuplicateSKU(sku: string): Promise<boolean> {
    const product = await this.productModel.findOne({ sku }).exec();
    return !!product;
  }

  /**
   * Creates a new product in the database
   */
  private async createProduct(productData: any): Promise<any> {
    const product = new this.productModel(productData);
    return await product.save();
  }

  /**
   * Alternative: All-or-nothing approach using transactions
   * Either all products are inserted or none
   * Uncomment and implement if you prefer this approach
   */
  /*
  async processBulkUploadWithTransaction(
    validatedRows: IValidationResult[],
  ): Promise<{
    successful: IUploadedRecord[];
    failed: IFailedRecord[];
  }> {
    const validRows = validatedRows.filter(row => row.isValid);
    const invalidRows = validatedRows.filter(row => !row.isValid);

    // If any validation errors, reject entire upload
    if (invalidRows.length > 0) {
      throw new BadRequestException('Please fix all validation errors before uploading');
    }

    // Start transaction
    const session = await this.productModel.db.startSession();
    session.startTransaction();

    try {
      const successful: IUploadedRecord[] = [];

      for (const row of validRows) {
        const product = new this.productModel(row.data);
        const saved = await product.save({ session });

        successful.push({
          rowNumber: row.rowNumber,
          data: row.data,
          id: saved._id.toString(),
        });
      }

      await session.commitTransaction();
      return { successful, failed: [] };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  */
}
