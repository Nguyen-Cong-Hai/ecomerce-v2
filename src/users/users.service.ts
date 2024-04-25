import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto, RegisterDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { Role } from 'src/roles/schemas/role.schema';

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

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
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

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: string) {
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

  isValidPassword(password: string, hashPassword: string) {
    return compareSync(password, hashPassword);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
