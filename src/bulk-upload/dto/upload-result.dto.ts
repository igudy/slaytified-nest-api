import { ApiProperty } from '@nestjs/swagger';

export class UploadResultDto {
  @ApiProperty({ description: 'Excel row number', example: 2 })
  rowNumber: number;

  @ApiProperty({ description: 'Row data from Excel file' })
  data: any;

  @ApiProperty({
    description: 'Validation or processing errors',
    required: false,
    type: 'array',
    items: {
      type: 'object',
      properties: {
        field: { type: 'string' },
        message: { type: 'string' },
        code: { type: 'string' },
      },
    },
  })
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
}

export class UploadSummaryDto {
  @ApiProperty({ description: 'Total rows processed', example: 100 })
  total: number;

  @ApiProperty({ description: 'Successfully uploaded rows', example: 85 })
  successful: number;

  @ApiProperty({ description: 'Failed rows', example: 15 })
  failed: number;
}
