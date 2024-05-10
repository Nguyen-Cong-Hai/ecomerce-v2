import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ProductType } from './schemas/product-type.schema';
import mongoose, { Model } from 'mongoose';
import aqp from 'api-query-params';

@Injectable()
export class ProductTypesService {
  constructor(
    @InjectModel(ProductType.name)
    private readonly productTypeModel: Model<ProductType>,
  ) {}

  async create(createProductTypeDto: CreateProductTypeDto) {
    const { name, slug } = createProductTypeDto;

    const checkSlug = await this.productTypeModel.findOne({ slug }).exec();

    if (checkSlug) {
      throw new BadRequestException('The product type slug already exists');
    }

    const newProductType = await this.productTypeModel.create({
      name,
      slug,
    });

    return newProductType;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population, projection } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.productTypeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.productTypeModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const checkProductType = await this.productTypeModel
      .findOne({ _id: id })
      .exec();

    if (!checkProductType) {
      throw new BadRequestException('The product type is not existed');
    }

    return checkProductType;
  }

  async update(id: string, updateProductTypeDto: UpdateProductTypeDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const checkProductType = await this.productTypeModel
      .findOne({ _id: id })
      .exec();

    if (!checkProductType) {
      throw new BadRequestException('The product type is not existed');
    }

    if (
      updateProductTypeDto.name &&
      updateProductTypeDto.name !== checkProductType.name
    ) {
      const existedName = await this.productTypeModel
        .findOne({
          name: updateProductTypeDto.name,
          _id: {
            $ne: id,
          },
        })
        .exec();

      if (existedName) {
        throw new BadRequestException('The product type name is existed');
      }
    }

    const updatedProductType = await this.productTypeModel.findByIdAndUpdate(
      id,
      updateProductTypeDto,
      { new: true },
    );

    return updatedProductType;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const checkProductType = await this.productTypeModel
      .findOne({ _id: id })
      .exec();

    if (!checkProductType) {
      throw new BadRequestException('The product type is not existed');
    }

    return await this.productTypeModel.findByIdAndDelete(id).exec();
  }
}
