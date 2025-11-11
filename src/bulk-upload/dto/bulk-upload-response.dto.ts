// Bulk Upload Response DTO
// The main response sent back to frontend after processing upload

import { ApiProperty } from '@nestjs/swagger';
import { UploadResultDto, UploadSummaryDto } from './upload-result.dto';

export class BulkUploadResponseDto {
  @ApiProperty({ description: 'Whether the upload was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Summary message', example: '85 products uploaded, 15 failed' })
  message: string;

  @ApiProperty({ description: 'Upload statistics', type: () => UploadSummaryDto })
  summary: UploadSummaryDto;

  @ApiProperty({ description: 'Successfully uploaded records', type: [UploadResultDto] })
  successfulRecords: UploadResultDto[];

  @ApiProperty({ description: 'Failed records with error details', type: [UploadResultDto] })
  failedRecords: UploadResultDto[];

  @ApiProperty({ description: 'Upload timestamp' })
  timestamp: Date;

  constructor(
    success: boolean,
    message: string,
    summary: UploadSummaryDto,
    successfulRecords: UploadResultDto[],
    failedRecords: UploadResultDto[],
  ) {
    this.success = success;
    this.message = message;
    this.summary = summary;
    this.successfulRecords = successfulRecords;
    this.failedRecords = failedRecords;
    this.timestamp = new Date();
  }
}
