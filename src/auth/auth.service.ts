import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  //Username and password la 2 tham so thu vien passport cha ve
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);

    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);

      if (isValid === true) {
        return user;
      }
    }

    return null;
  }

  async register(user: RegisterDto) {
    let newUser = await this.usersService.register(user);

    return newUser;
  }

  async login(user: IUser) {
    const { _id, name, email, role } = user;

    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role: {
        name: role.name,
        permissions: role.permissions,
      },
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role: {
          name: role.name,
          permissions: role.permissions,
        },
      },
    };
  }
}
