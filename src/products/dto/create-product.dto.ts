import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Unique SKU for the product',
    example: 'PROD001',
  })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Mouse',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Ergonomic wireless mouse with 3 buttons',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Product price',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/images/product.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
