// Bulk Download Controller - handles template downloads
// Provides endpoints to download Excel templates

import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiProduces } from '@nestjs/swagger';
import { ExcelGeneratorUtil } from '../utils/excel-generator.util';

@ApiTags('bulk')
@Controller('bulk')
export class BulkDownloadController {
  /**
   * Downloads product upload template
   * GET /bulk/products/template
   */
  @Get('products/template')
  @ApiOperation({
    summary: 'Download product upload template',
    description: 'Downloads an Excel template for bulk product upload with instructions and sample data'
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Excel template file',
  })
  downloadProductTemplate(@Res() res: Response) {
    try {
      // Generate Excel template
      const excelBuffer = ExcelGeneratorUtil.generateProductTemplate();

      // Set headers for file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=product-bulk-upload-template.xlsx',
      );
      res.setHeader('Content-Length', excelBuffer.length);

      // Send file
      return res.status(HttpStatus.OK).send(excelBuffer);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate template',
        error: error.message,
      });
    }
  }

  /**
   * Downloads user upload template
   * GET /bulk/users/template
   */
  @Get('users/template')
  @ApiOperation({
    summary: 'Download user upload template',
    description: 'Downloads an Excel template for bulk user upload with instructions and sample data'
  })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Excel template file',
  })
  downloadUserTemplate(@Res() res: Response) {
    try {
      const excelBuffer = ExcelGeneratorUtil.generateUserTemplate();

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=user-bulk-upload-template.xlsx',
      );
      res.setHeader('Content-Length', excelBuffer.length);

      return res.status(HttpStatus.OK).send(excelBuffer);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate template',
        error: error.message,
      });
    }
  }

  /**
   * Downloads error report with failed records
   * This would typically be called from the frontend after an upload
   * For now, this is a placeholder showing how it would work
   */
  /*
  @Post('download-errors')
  downloadErrorReport(
    @Body() body: { failedRecords: any[]; type: 'product' | 'user' },
    @Res() res: Response,
  ) {
    try {
      const excelBuffer = ExcelGeneratorUtil.generateErrorReport(
        body.failedRecords,
        body.type,
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${body.type}-upload-errors.xlsx`,
      );

      return res.status(HttpStatus.OK).send(excelBuffer);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to generate error report',
      });
    }
  }
  */
}
