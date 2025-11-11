# Bulk Upload Module

This module provides functionality for bulk uploading products and users via Excel files.

## Overview

The bulk upload system allows users to:
1. Download Excel templates
2. Fill in data offline
3. Upload filled Excel files
4. Receive detailed feedback on success/failures
5. Download error reports for failed rows

## Architecture

```
User Request
    ↓
Controller (receives file)
    ↓
Excel Parser (converts to JSON)
    ↓
Validator (validates each row)
    ↓
Bulk Service (processes & saves to DB)
    ↓
Response (success/failure details)
```

## Key Components

### 1. **Controllers**
- **BulkUploadController**: Handles file uploads (`POST /bulk/products/upload`, `/bulk/users/upload`)
- **BulkDownloadController**: Provides template downloads (`GET /bulk/products/template`, `/bulk/users/template`)

### 2. **Services**
- **ExcelParserService**: Parses Excel files to JavaScript objects
- **BulkProductService**: Handles bulk product database operations
- **BulkUserService**: Handles bulk user database operations

### 3. **Validators**
- **ProductValidator**: Validates product data (SKU, price, stock, etc.)
- **UserValidator**: Validates user data (email, role, etc.)

### 4. **Utilities**
- **ExcelGeneratorUtil**: Generates downloadable Excel templates
- **ErrorFormatterUtil**: Creates consistent error messages

### 5. **DTOs & Interfaces**
- Define data structures for requests/responses
- Type safety throughout the application

## API Endpoints

### Download Templates

```bash
# Download product template
GET http://localhost:3000/bulk/products/template

# Download user template
GET http://localhost:3000/bulk/users/template
```

### Upload Files

```bash
# Upload products
POST http://localhost:3000/bulk/products/upload
Content-Type: multipart/form-data
Body: file=<excel_file>

# Upload users
POST http://localhost:3000/bulk/users/upload
Content-Type: multipart/form-data
Body: file=<excel_file>
```

### Response Format

```json
{
  "success": true,
  "message": "85 products uploaded, 15 failed",
  "summary": {
    "total": 100,
    "successful": 85,
    "failed": 15
  },
  "successfulRecords": [
    {
      "rowNumber": 2,
      "data": { "sku": "PROD001", "name": "Product 1", ... },
      "id": "generated-id-123"
    }
  ],
  "failedRecords": [
    {
      "rowNumber": 12,
      "data": { "sku": "PROD012", ... },
      "errors": [
        {
          "field": "price",
          "message": "Price must be greater than 0",
          "code": "RANGE_ERROR"
        }
      ]
    }
  ],
  "timestamp": "2024-11-08T12:00:00.000Z"
}
```

## How It Works

### 1. Template Download
- User clicks "Download Template" button
- Backend generates Excel file with:
  - Instructions sheet
  - Data entry sheet with headers
  - Column width formatting
  - Sample data (optional)

### 2. File Upload & Processing

**Step 1: File Reception**
- Multer middleware receives file
- Validates file type (.xlsx, .xls only)
- Validates file size (max 5MB)

**Step 2: Parsing**
- Excel file converted to JSON array
- Headers normalized (remove *, trim, camelCase)
- Empty rows filtered out
- Required columns validated

**Step 3: Validation**
- Each row validated independently
- Checks for:
  - Required fields
  - Data types
  - Format (email, URL, phone)
  - Ranges (price > 0, stock >= 0)
  - Business rules

**Step 4: Database Processing**
- Valid rows processed one-by-one
- Duplicate checks performed (SKU, email)
- Database insert attempted
- Errors caught and logged

**Step 5: Response**
- Summary statistics calculated
- Successful and failed records separated
- Detailed error messages provided
- Frontend can display results

## Validation Rules

### Products
- **SKU**: Required, string, unique
- **Name**: Required, string, max 255 chars
- **Description**: Required, string
- **Price**: Required, number, > 0
- **Category**: Required, string
- **Stock**: Required, integer, >= 0
- **Image URL**: Optional, valid URL if provided

### Users
- **Email**: Required, valid email format, unique
- **First Name**: Required, string, max 100 chars
- **Last Name**: Required, string, max 100 chars
- **Role**: Required, one of: admin, user, manager
- **Phone Number**: Optional, valid phone format if provided

## Error Codes

- `REQUIRED`: Field is missing
- `INVALID_FORMAT`: Wrong data type or format
- `RANGE_ERROR`: Value out of acceptable range
- `DUPLICATE`: Value already exists in database
- `INVALID_REFERENCE`: Foreign key doesn't exist
- `DATABASE_ERROR`: Database operation failed
- `VALIDATION_ERROR`: Generic validation failure

## Setup Instructions

### 1. Install Dependencies

```bash
npm install xlsx multer @nestjs/platform-express
npm install -D @types/multer
```

### 2. Import Module

Add to your `app.module.ts`:

```typescript
import { BulkUploadModule } from './bulk-upload/bulk-upload.module';

@Module({
  imports: [
    BulkUploadModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Configure Database Integration

Update `bulk-product.service.ts` and `bulk-user.service.ts`:

For Mongoose:
```typescript
constructor(@InjectModel('Product') private productModel: Model<Product>) {}

private async checkDuplicateSKU(sku: string): Promise<boolean> {
  const product = await this.productModel.findOne({ sku }).exec();
  return !!product;
}

private async createProduct(productData: any): Promise<Product> {
  const product = new this.productModel(productData);
  return await product.save();
}
```

For TypeORM:
```typescript
constructor(
  @InjectRepository(Product)
  private productRepository: Repository<Product>
) {}

private async checkDuplicateSKU(sku: string): Promise<boolean> {
  const product = await this.productRepository.findOne({ where: { sku } });
  return !!product;
}

private async createProduct(productData: any): Promise<Product> {
  const product = this.productRepository.create(productData);
  return await this.productRepository.save(product);
}
```

### 4. Test the Endpoints

Using Postman or cURL:

```bash
# Download template
curl -O http://localhost:3000/bulk/products/template

# Upload file
curl -X POST http://localhost:3000/bulk/products/upload \
  -F "file=@product-data.xlsx"
```

## Advanced Features (Optional)

### 1. Transaction-based Upload
Uncomment the `processBulkUploadWithTransaction` method in bulk services for all-or-nothing behavior.

### 2. Async Processing
For large files, implement queue-based processing using Bull or BullMQ.

### 3. Progress Tracking
Add WebSocket support to send real-time progress updates.

### 4. Email Notifications
Send email when large uploads complete.

### 5. Upload History
Track all bulk uploads in database for audit trail.

## Security Considerations

✅ File type validation (MIME type check)
✅ File size limits (5MB)
✅ Input sanitization
✅ SQL injection prevention (use parameterized queries)
✅ Rate limiting (implement at controller level)
⚠️ Add virus scanning for production
⚠️ Add authentication/authorization
⚠️ Log all operations for audit

## Performance Tips

1. **Batch Processing**: For files with 10,000+ rows, process in chunks
2. **Database Indexing**: Ensure unique fields (SKU, email) are indexed
3. **Connection Pooling**: Use database connection pools
4. **Memory Management**: Files stored in memory - monitor usage
5. **Async Operations**: Consider background jobs for large uploads

## Troubleshooting

**Problem**: "Missing required columns" error
- **Solution**: Ensure template structure matches expected headers

**Problem**: File upload fails with 413 error
- **Solution**: Increase file size limit in Multer config

**Problem**: All rows failing validation
- **Solution**: Check Excel sheet name matches expected ("Products" or "Users")

**Problem**: Duplicate errors not detected
- **Solution**: Implement actual database queries in service methods

## Next Steps

1. Implement actual database integration
2. Add authentication middleware
3. Add rate limiting
4. Create frontend components
5. Add comprehensive error logging
6. Write unit tests
7. Add API documentation (Swagger)
