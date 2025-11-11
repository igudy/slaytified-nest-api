// Bulk Upload Interfaces
// These interfaces define the shape of data throughout the upload process

export interface IProductRow {
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

export interface IUserRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
}

export interface IUploadedRecord {
  rowNumber: number;
  data: any;
  id?: string;  // Database ID after successful insert
}

export interface IFailedRecord {
  rowNumber: number;
  data: any;
  errors: Array<{ field: string; message: string; code?: string }>;
}
