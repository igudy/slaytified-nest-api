import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * Create a new product
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productModel.findOne({ sku: createProductDto.sku }).exec();
    if (existingProduct) {
      throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists`);
    }

    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  /**
   * Get all products
   */
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  /**
   * Get a single product by ID
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
    return product;
  }

  /**
   * Update a product
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // If SKU is being updated, check for duplicates
    if (updateProductDto.sku) {
      const existingProduct = await this.productModel
        .findOne({ sku: updateProductDto.sku, _id: { $ne: id } })
        .exec();
      if (existingProduct) {
        throw new ConflictException(`Product with SKU "${updateProductDto.sku}" already exists`);
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return updatedProduct;
  }

  /**
   * Delete a product
   */
  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }
  }
}
