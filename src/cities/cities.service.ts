import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import mongoose, { Model } from 'mongoose';
import { City } from './schemas/city.schema';
import { InjectModel } from '@nestjs/mongoose';
import aqp from 'api-query-params';

@Injectable()
export class CitiesService {
  constructor(
    @InjectModel(City.name)
    private readonly cityModel: Model<City>,
  ) {}

  async create(createCityDto: CreateCityDto) {
    const { name } = createCityDto;

    const checkCity = await this.cityModel
      .findOne({
        name,
      })
      .exec();

    if (checkCity) {
      throw new BadRequestException('The name of city is existed');
    }

    const createCity = await this.cityModel.create({ name });

    return createCity;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.cityModel.find(filter)).length;

    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.cityModel
      .find(filter)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .skip(offset)
      .limit(defaultLimit)
      .exec();

    return {
      meta: {
        currentPage: currentPage,
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

    const cityExisted = await this.cityModel.findOne({ _id: id }).exec();

    if (!cityExisted) {
      throw new BadRequestException('The city is not existed');
    }

    return cityExisted;
  }

  async update(id: string, updateCityDto: UpdateCityDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const { name } = updateCityDto;

    const checkCity = await this.cityModel.findOne({ _id: id }).exec();

    if (!checkCity) {
      throw new BadRequestException('The city is not existed');
    }

    if (name && name !== checkCity.name) {
      const existedName = await this.cityModel.findOne({
        name,
        _id: { $ne: id },
      });

      if (existedName !== null) {
        throw new BadRequestException('The name of city is existed');
      }
    }

    const updateCity = await this.cityModel
      .findByIdAndUpdate(
        id,
        { name },
        {
          new: true,
        },
      )
      .exec();

    return updateCity;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const checkCity = await this.cityModel.findOne({ _id: id }).exec();

    if (!checkCity) {
      throw new BadRequestException('The city is not existed');
    }

    return await this.cityModel.findByIdAndDelete(id).exec();
  }
}
