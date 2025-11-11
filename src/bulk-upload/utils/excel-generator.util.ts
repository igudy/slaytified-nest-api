// Excel Generator Utility - generates downloadable Excel templates
// This utility creates Excel templates that users can download and fill

import * as XLSX from 'xlsx';

export class ExcelGeneratorUtil {
  /**
   * Generates a product template Excel file
   * Creates 2 sheets: Instructions and Products
   */
  static generateProductTemplate(): Buffer {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Instructions
    const instructionsData = [
      ['Product Bulk Upload Instructions'],
      [''],
      ['1. Fill in all required fields marked with *'],
      ['2. SKU must be unique'],
      ['3. Price must be a positive number'],
      ['4. Stock must be a whole number (0 or greater)'],
      ['5. Category should match existing categories in the system'],
      ['6. Image URL should be a valid URL (optional)'],
      [''],
      ['Sample Data:'],
      ['SKU', 'Name', 'Description', 'Price', 'Category', 'Stock', 'Image URL'],
      ['PROD001', 'Sample Product', 'This is a sample', '99.99', 'Electronics', '100', 'https://example.com/image.jpg'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Sheet 2: Products (where users will enter data)
    const productHeaders = [
      ['SKU*', 'Name*', 'Description*', 'Price*', 'Category*', 'Stock*', 'Image URL']
    ];

    const productSheet = XLSX.utils.aoa_to_sheet(productHeaders);

    // Set column widths for better readability
    productSheet['!cols'] = [
      { wch: 15 },  // SKU
      { wch: 25 },  // Name
      { wch: 40 },  // Description
      { wch: 10 },  // Price
      { wch: 15 },  // Category
      { wch: 10 },  // Stock
      { wch: 35 },  // Image URL
    ];

    XLSX.utils.book_append_sheet(workbook, productSheet, 'Products');

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }

  /**
   * Generates a user template Excel file
   * Creates 2 sheets: Instructions and Users
   */
  static generateUserTemplate(): Buffer {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Instructions
    const instructionsData = [
      ['User Bulk Upload Instructions'],
      [''],
      ['1. Fill in all required fields marked with *'],
      ['2. Email must be unique and valid'],
      ['3. Role must be one of: admin, user, manager'],
      ['4. Phone number is optional'],
      [''],
      ['Sample Data:'],
      ['Email', 'First Name', 'Last Name', 'Role', 'Phone Number'],
      ['john@example.com', 'John', 'Doe', 'user', '+1234567890'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Sheet 2: Users
    const userHeaders = [
      ['Email*', 'First Name*', 'Last Name*', 'Role*', 'Phone Number']
    ];

    const userSheet = XLSX.utils.aoa_to_sheet(userHeaders);

    userSheet['!cols'] = [
      { wch: 30 },  // Email
      { wch: 20 },  // First Name
      { wch: 20 },  // Last Name
      { wch: 15 },  // Role
      { wch: 20 },  // Phone Number
    ];

    XLSX.utils.book_append_sheet(workbook, userSheet, 'Users');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }

  /**
   * Generates an Excel file with failed records for user to fix and re-upload
   * Adds an 'Errors' column to show what went wrong
   */
  static generateErrorReport(
    failedRecords: Array<{ rowNumber: number; data: any; errors: any[] }>,
    type: 'product' | 'user',
  ): Buffer {
    const workbook = XLSX.utils.book_new();

    // Prepare data with error messages
    const headers = type === 'product'
      ? ['Row', 'SKU', 'Name', 'Description', 'Price', 'Category', 'Stock', 'Image URL', 'Errors']
      : ['Row', 'Email', 'First Name', 'Last Name', 'Role', 'Phone Number', 'Errors'];

    const rows = failedRecords.map(record => {
      const errorMessages = record.errors.map(e => `${e.field}: ${e.message}`).join('; ');

      if (type === 'product') {
        return [
          record.rowNumber,
          record.data.sku || '',
          record.data.name || '',
          record.data.description || '',
          record.data.price || '',
          record.data.category || '',
          record.data.stock || '',
          record.data.imageUrl || '',
          errorMessages,
        ];
      } else {
        return [
          record.rowNumber,
          record.data.email || '',
          record.data.firstName || '',
          record.data.lastName || '',
          record.data.role || '',
          record.data.phoneNumber || '',
          errorMessages,
        ];
      }
    });

    const sheetData = [headers, ...rows];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Highlight error column in red (if supported)
    sheet['!cols'] = type === 'product'
      ? [
          { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 40 },
          { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 35 }, { wch: 50 }
        ]
      : [
          { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
          { wch: 15 }, { wch: 20 }, { wch: 50 }
        ];

    XLSX.utils.book_append_sheet(workbook, sheet, 'Failed Records');

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return excelBuffer;
  }
}
