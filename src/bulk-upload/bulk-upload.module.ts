import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { BulkUploadController } from './controllers/bulk-upload.controller';
import { BulkDownloadController } from './controllers/bulk-download.controller';

import { ExcelParserService } from './services/excel-parser.service';
import { BulkProductService } from './services/bulk-product.service';
import { BulkUserService } from './services/bulk-user.service';

import { ProductValidator } from './validators/product.validator';
import { UserValidator } from './validators/user.validator';

import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
    ProductsModule,
    UsersModule,
  ],
  controllers: [BulkUploadController, BulkDownloadController],
  providers: [
    ExcelParserService,
    BulkProductService,
    BulkUserService,
    ProductValidator,
    UserValidator,
  ],
  exports: [ExcelParserService, BulkProductService, BulkUserService],
})
export class BulkUploadModule {}
