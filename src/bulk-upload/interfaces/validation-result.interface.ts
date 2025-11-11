// Validation Result Interface
// This defines the structure for validation results per row

export interface IFieldError {
  field: string;        // The field name that has an error (e.g., 'email', 'price')
  message: string;      // Human-readable error message
  code?: string;        // Optional error code for frontend handling (e.g., 'REQUIRED', 'INVALID_FORMAT')
}

export interface IValidationResult {
  rowNumber: number;           // Excel row number (1-based index)
  isValid: boolean;            // Whether the row passed all validations
  data: any;                   // The actual data from the row
  errors: IFieldError[];       // Array of field-specific errors
}

export interface IBulkValidationResult {
  totalRows: number;                      // Total number of rows processed
  validRows: IValidationResult[];         // Rows that passed validation
  invalidRows: IValidationResult[];       // Rows that failed validation
}
