// Bulk Upload Module
// Wires together all bulk upload components

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

// Controllers
import { BulkUploadController } from './controllers/bulk-upload.controller';
import { BulkDownloadController } from './controllers/bulk-download.controller';

// Services
import { ExcelParserService } from './services/excel-parser.service';
import { BulkProductService } from './services/bulk-product.service';
import { BulkUserService } from './services/bulk-user.service';

// Validators
import { ProductValidator } from './validators/product.validator';
import { UserValidator } from './validators/user.validator';

// Import Product and User modules for database access
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    // Configure Multer for file uploads
    // Files are stored in memory as Buffer
    MulterModule.register({
      storage: 'memory', // Store in memory instead of disk
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),

    // Import modules for database access
    ProductsModule,
    UsersModule,
  ],
  controllers: [
    BulkUploadController,
    BulkDownloadController,
  ],
  providers: [
    // Services
    ExcelParserService,
    BulkProductService,
    BulkUserService,

    // Validators
    ProductValidator,
    UserValidator,
  ],
  exports: [
    // Export services if other modules need them
    ExcelParserService,
    BulkProductService,
    BulkUserService,
  ],
})
export class BulkUploadModule {}
