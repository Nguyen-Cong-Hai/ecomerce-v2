import { InjectModel } from '@nestjs/mongoose';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './schemas/role.schema';
import { ConflictException, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    //check nameRole is exist or not
    const existedRole = await this.roleModel.findOne({
      name,
    });

    if (existedRole !== null) {
      throw new ConflictException('Role is already existed');
    }

    const createdRole = await this.roleModel.create({ name });

    return createdRole;
  }

  async findAll() {
    return await this.roleModel.find({});
  }

  findOne(id: number) {
    return `This action returns a #${id} role`;
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
