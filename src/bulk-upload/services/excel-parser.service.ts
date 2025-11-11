// Excel Parser Service - parses Excel files to JSON
// Converts uploaded Excel file into JavaScript objects

import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelParserService {
  /**
   * Parses an Excel file buffer and returns JSON data
   * @param fileBuffer - The uploaded file as a Buffer
   * @param sheetName - Name of the sheet to parse (defaults to first sheet)
   * @returns Array of row objects
   */
  parseExcelFile(fileBuffer: Buffer, sheetName?: string): any[] {
    try {
      // Read the workbook from buffer
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // Get the sheet to parse
      const sheet = sheetName
        ? workbook.Sheets[sheetName]
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new BadRequestException(
          `Sheet "${sheetName || workbook.SheetNames[0]}" not found in the Excel file`,
        );
      }

      // Convert sheet to JSON
      // header: 1 means use first row as headers
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '', // Default value for empty cells
      });

      if (jsonData.length === 0) {
        throw new BadRequestException('Excel file is empty');
      }

      // Extract headers (first row)
      const headers = jsonData[0] as string[];

      // Convert rows to objects using headers
      const dataRows = jsonData.slice(1) as any[][];

      const parsedData = dataRows
        .filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined)) // Filter out empty rows
        .map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            // Normalize header names (remove *, trim, camelCase)
            const normalizedHeader = this.normalizeHeader(header);
            obj[normalizedHeader] = row[index] !== undefined ? row[index] : '';
          });
          return obj;
        });

      if (parsedData.length === 0) {
        throw new BadRequestException('No data found in Excel file');
      }

      return parsedData;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to parse Excel file. Please ensure it is a valid Excel file.');
    }
  }

  /**
   * Parses product Excel file
   * Uses specific sheet name and validates structure
   */
  parseProductFile(fileBuffer: Buffer): any[] {
    const data = this.parseExcelFile(fileBuffer, 'Products');

    // Validate that required columns exist
    const requiredColumns = ['sku', 'name', 'description', 'price', 'category', 'stock'];
    this.validateColumns(data[0], requiredColumns);

    return data;
  }

  /**
   * Parses user Excel file
   */
  parseUserFile(fileBuffer: Buffer): any[] {
    const data = this.parseExcelFile(fileBuffer, 'Users');

    // Validate required columns
    const requiredColumns = ['email', 'firstName', 'lastName', 'role'];
    this.validateColumns(data[0], requiredColumns);

    return data;
  }

  /**
   * Normalizes header names to camelCase
   * Removes special characters, spaces, and * (required marker)
   */
  private normalizeHeader(header: string): string {
    return header
      .replace(/\*/g, '') // Remove asterisks
      .trim()
      .split(/\s+/) // Split by spaces
      .map((word, index) => {
        word = word.toLowerCase();
        // Capitalize first letter of each word except first
        return index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('');
  }

  /**
   * Validates that all required columns exist in the data
   */
  private validateColumns(firstRow: any, requiredColumns: string[]): void {
    if (!firstRow) {
      throw new BadRequestException('Excel file has no data');
    }

    const existingColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(
      col => !existingColumns.includes(col)
    );

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Missing required columns: ${missingColumns.join(', ')}. Please use the provided template.`
      );
    }
  }
}
