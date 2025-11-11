// Bulk Upload Controller - handles upload requests
// Main controller that orchestrates the entire bulk upload process

import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ExcelParserService } from '../services/excel-parser.service';
import { ProductValidator } from '../validators/product.validator';
import { UserValidator } from '../validators/user.validator';
import { BulkProductService } from '../services/bulk-product.service';
import { BulkUserService } from '../services/bulk-user.service';
import { BulkUploadResponseDto } from '../dto/bulk-upload-response.dto';
import { UploadSummaryDto } from '../dto/upload-result.dto';

@ApiTags('bulk')
@Controller('bulk')
export class BulkUploadController {
  private readonly logger = new Logger(BulkUploadController.name);

  constructor(
    private readonly excelParserService: ExcelParserService,
    private readonly productValidator: ProductValidator,
    private readonly userValidator: UserValidator,
    private readonly bulkProductService: BulkProductService,
    private readonly bulkUserService: BulkUserService,
  ) {}

  /**
   * Handles bulk product upload
   * POST /bulk/products/upload
   *
   * Process flow:
   * 1. Receive Excel file
   * 2. Parse Excel to JSON
   * 3. Validate each row
   * 4. Process valid rows (insert to DB)
   * 5. Return results with successes and failures
   */
  @Post('products/upload')
  @ApiOperation({
    summary: 'Bulk upload products',
    description: 'Upload an Excel file with multiple products. Download the template first from /bulk/products/template'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Products uploaded successfully',
    type: BulkUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, callback) => {
        // Only accept Excel files
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel'
        ) {
          callback(null, true);
        } else {
          callback(
            new HttpException(
              'Only Excel files (.xlsx, .xls) are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadProducts(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Processing product bulk upload...');

    try {
      // Step 1: Validate file exists
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Received file: ${file.originalname}, size: ${file.size} bytes`);

      // Step 2: Parse Excel file
      const parsedData = this.excelParserService.parseProductFile(file.buffer);
      this.logger.log(`Parsed ${parsedData.length} rows from Excel`);

      // Step 3: Validate all rows
      const validationResults = this.productValidator.validateBatch(parsedData);
      const validCount = validationResults.filter(r => r.isValid).length;
      const invalidCount = validationResults.filter(r => !r.isValid).length;

      this.logger.log(`Validation complete: ${validCount} valid, ${invalidCount} invalid`);

      // Step 4: Process the upload (insert valid rows to DB)
      const { successful, failed } = await this.bulkProductService.processBulkUpload(
        validationResults,
      );

      // Step 5: Build response
      const summary: UploadSummaryDto = {
        total: parsedData.length,
        successful: successful.length,
        failed: failed.length,
      };

      const message =
        failed.length === 0
          ? 'All products uploaded successfully'
          : successful.length === 0
          ? 'All products failed to upload'
          : `${successful.length} products uploaded, ${failed.length} failed`;

      const response = new BulkUploadResponseDto(
        failed.length === 0,
        message,
        summary,
        successful,
        failed,
      );

      this.logger.log(
        `Upload complete: ${successful.length} successful, ${failed.length} failed`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Bulk upload failed: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to process bulk upload',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Handles bulk user upload
   * POST /bulk/users/upload
   *
   * Same process as products but for users
   */
  @Post('users/upload')
  @ApiOperation({
    summary: 'Bulk upload users',
    description: 'Upload an Excel file with multiple users. Download the template first from /bulk/users/template'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Users uploaded successfully',
    type: BulkUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (
          file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-excel'
        ) {
          callback(null, true);
        } else {
          callback(
            new HttpException(
              'Only Excel files (.xlsx, .xls) are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadUsers(@UploadedFile() file: Express.Multer.File) {
    this.logger.log('Processing user bulk upload...');

    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Received file: ${file.originalname}, size: ${file.size} bytes`);

      // Parse
      const parsedData = this.excelParserService.parseUserFile(file.buffer);
      this.logger.log(`Parsed ${parsedData.length} rows from Excel`);

      // Validate
      const validationResults = this.userValidator.validateBatch(parsedData);
      const validCount = validationResults.filter(r => r.isValid).length;
      const invalidCount = validationResults.filter(r => !r.isValid).length;

      this.logger.log(`Validation complete: ${validCount} valid, ${invalidCount} invalid`);

      // Process
      const { successful, failed } = await this.bulkUserService.processBulkUpload(
        validationResults,
      );

      // Response
      const summary: UploadSummaryDto = {
        total: parsedData.length,
        successful: successful.length,
        failed: failed.length,
      };

      const message =
        failed.length === 0
          ? 'All users uploaded successfully'
          : successful.length === 0
          ? 'All users failed to upload'
          : `${successful.length} users uploaded, ${failed.length} failed`;

      const response = new BulkUploadResponseDto(
        failed.length === 0,
        message,
        summary,
        successful,
        failed,
      );

      this.logger.log(
        `Upload complete: ${successful.length} successful, ${failed.length} failed`,
      );

      return response;
    } catch (error) {
      this.logger.error(`Bulk upload failed: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to process bulk upload',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
