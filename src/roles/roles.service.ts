import { InjectModel } from '@nestjs/mongoose';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './schemas/role.schema';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import aqp from 'api-query-params';
import { CONFIG_PERMISSIONS } from 'src/constants/enum';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, permissions } = createRoleDto;

    //check nameRole is exist or not
    const existedRole = await this.roleModel.findOne({
      name,
    });

    if (existedRole !== null) {
      throw new ConflictException('The name of role is existed');
    }

    const createdRole = await this.roleModel.create({
      name,
      permissions: permissions?.includes(CONFIG_PERMISSIONS.ADMIN)
        ? []
        : permissions,
    });

    return createdRole;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.roleModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage, //trang hiện tại
        pageSize: limit, //số lượng bản ghi đã lấy
        pages: totalPages, //tổng số trang với điều kiện query
        total: totalItems, // tổng số phần tử (số bản ghi)
      },
      result, //kết quả query
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    let role = await this.roleModel.findOne({ _id: id }).exec();

    if (role === null) {
      throw new BadRequestException('The role is not exsited');
    }

    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const { name, permissions } = updateRoleDto;

    const checkRole = await this.roleModel.findOne({ _id: id }).exec();

    if (checkRole === null) {
      throw new BadRequestException('The role is not exsited');
    }

    if (
      checkRole.name === 'Admin' ||
      checkRole.name === 'Basic' ||
      checkRole.permissions.includes(CONFIG_PERMISSIONS.ADMIN) ||
      checkRole.permissions.includes(CONFIG_PERMISSIONS.BASIC)
    ) {
      throw new BadRequestException('The role is not allowed to update');
    }

    if (name && name !== checkRole.name) {
      const existedRole = await this.roleModel
        .findOne({
          name: name,
          _id: { $ne: id },
        })
        .exec();

      if (existedRole !== null) {
        throw new BadRequestException('The name of role is existed');
      }
    }

    const updatedRole = await this.roleModel
      .findByIdAndUpdate(
        id,
        {
          name,
          permissions,
        },
        { new: true },
      )
      .exec();

    return updatedRole;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const checkRole = await this.roleModel.findOne({ _id: id }).exec();

    if (checkRole === null) {
      throw new BadRequestException('The role is not exsited');
    }

    const deletedRole = await this.roleModel.findByIdAndDelete(id).exec();

    return deletedRole;
  }
}
