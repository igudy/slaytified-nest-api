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

  private async checkDuplicateSKU(sku: string): Promise<boolean> {
    const product = await this.productModel.findOne({ sku }).exec();
    return !!product;
  }

  private async createProduct(productData: any): Promise<any> {
    const product = new this.productModel(productData);
    return await product.save();
  }