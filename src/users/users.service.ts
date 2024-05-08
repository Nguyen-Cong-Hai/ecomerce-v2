import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { Role } from 'src/roles/schemas/role.schema';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(Role.name)
    private readonly roleModel: Model<Role>,
  ) {}

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  isValidPassword(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, city, address, avatar, password, phoneNumber, role } =
      createUserDto;

    const isExistedEmail = await this.userModel.findOne({ email });

    if (isExistedEmail) {
      throw new BadRequestException(`Email is already existed`);
    }

    const roleBasic = await this.roleModel.findOne({ name: 'Basic' });

    const hashPassword = this.getHashPassword(password);

    const newUser = await this.userModel.create({
      email,
      password: hashPassword,
      name,
      city,
      address,
      avatar,
      phoneNumber,
      role: roleBasic._id,
    });

    return newUser;
  }

  async register(user: RegisterDto) {
    const { email, password } = user;

    //check email
    const isExistedEmail = await this.userModel.findOne({ email });

    if (isExistedEmail) {
      throw new BadRequestException('Email is already existed');
    }

    //hash password
    const hass = this.getHashPassword(password);

    //get role default
    const roleBasic = await this.roleModel.findOne({ name: 'Basic' });

    //register user
    let registerAuth = await this.userModel.create({
      email,
      role: roleBasic._id,
      password: hass,
    });

    return registerAuth;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, projection, population } = aqp(qs);

    delete filter.page;
    delete filter.limit;

    let offset = (+currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      // @ts-ignore: Unreachable code error
      .sort(sort)
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

    const user = await this.userModel
      .findById(id)
      .select('-password')
      .populate({ path: 'role', select: 'name permissions' });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findOneByUsername(username: string) {
    return await this.userModel
      .findOne({
        email: username,
      })
      .populate({ path: 'role', select: 'name permissions' });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const isExistedUser = await this.userModel.findOne({ _id: id });

    if (!isExistedUser) {
      throw new NotFoundException(`User with ID not found`);
    }

    const updateUser = await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        ...updateUserDto,
      },
    );

    return updateUser;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Object ID');
    }

    const isExistedUser = await this.userModel.findOne({ _id: id });

    if (!isExistedUser) {
      throw new NotFoundException(`User with ID not found`);
    }

    const deleteUser = await this.userModel.deleteOne({ _id: id });

    return deleteUser;
  }

  updateUserToken = async (refreshToken: string, id: string) => {
    return await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        refreshToken,
      }
    );
  };
}
