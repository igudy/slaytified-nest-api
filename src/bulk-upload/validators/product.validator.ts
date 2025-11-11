// Product Validator - validates product data
// This validates each product row from the Excel file

import { Injectable } from '@nestjs/common';
import { IProductRow } from '../interfaces/bulk-upload.interface';
import { IFieldError, IValidationResult } from '../interfaces/validation-result.interface';
import { ErrorFormatterUtil } from '../utils/error-formatter.util';

@Injectable()
export class ProductValidator {
  /**
   * Validates a single product row
   * Returns validation result with any errors found
   */
  validate(data: any, rowNumber: number): IValidationResult {
    const errors: IFieldError[] = [];

    // Validate SKU (required, string, not empty)
    if (!data.sku || typeof data.sku !== 'string' || data.sku.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('sku'));
    }

    // Validate Name (required, string, not empty)
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('name'));
    } else if (data.name.length > 255) {
      errors.push(
        ErrorFormatterUtil.formatFieldError(
          'name',
          'Name must be less than 255 characters',
          'MAX_LENGTH',
        ),
      );
    }

    // Validate Description (required, string)
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('description'));
    }

    // Validate Price (required, positive number)
    if (data.price === undefined || data.price === null || data.price === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('price'));
    } else {
      const price = Number(data.price);
      if (isNaN(price)) {
        errors.push(ErrorFormatterUtil.invalidFormatError('price', 'number'));
      } else if (price <= 0) {
        errors.push(ErrorFormatterUtil.rangeError('price', 0.01));
      }
    }

    // Validate Category (required, string)
    if (!data.category || typeof data.category !== 'string' || data.category.trim() === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('category'));
    }

    // Validate Stock (required, non-negative integer)
    if (data.stock === undefined || data.stock === null || data.stock === '') {
      errors.push(ErrorFormatterUtil.requiredFieldError('stock'));
    } else {
      const stock = Number(data.stock);
      if (isNaN(stock)) {
        errors.push(ErrorFormatterUtil.invalidFormatError('stock', 'number'));
      } else if (!Number.isInteger(stock)) {
        errors.push(
          ErrorFormatterUtil.formatFieldError(
            'stock',
            'Stock must be a whole number',
            'INVALID_FORMAT',
          ),
        );
      } else if (stock < 0) {
        errors.push(ErrorFormatterUtil.rangeError('stock', 0));
      }
    }

    // Validate Image URL (optional, but must be valid URL if provided)
    if (data.imageUrl && data.imageUrl.trim() !== '') {
      if (!this.isValidUrl(data.imageUrl)) {
        errors.push(ErrorFormatterUtil.invalidFormatError('imageUrl', 'valid URL'));
      }
    }

    return {
      rowNumber,
      isValid: errors.length === 0,
      data: this.sanitizeData(data),
      errors,
    };
  }

  /**
   * Validates multiple product rows
   */
  validateBatch(products: any[]): IValidationResult[] {
    return products.map((product, index) =>
      this.validate(product, index + 2) // +2 because row 1 is headers, Excel is 1-indexed
    );
  }

  /**
   * Helper method to validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes and normalizes the data
   * Trims strings, converts numbers, removes extra fields
   */
  private sanitizeData(data: any): IProductRow {
    return {
      sku: data.sku?.trim() || '',
      name: data.name?.trim() || '',
      description: data.description?.trim() || '',
      price: Number(data.price) || 0,
      category: data.category?.trim() || '',
      stock: Number(data.stock) || 0,
      imageUrl: data.imageUrl?.trim() || undefined,
    };
  }
}
