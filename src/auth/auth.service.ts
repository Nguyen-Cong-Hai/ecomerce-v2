import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import ms from 'ms';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  async login(user: IUser, response: Response) {
    const { _id, name, email, role, address, avatar, phoneNumber } = user;

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

    const refresh_token = this.createRefreshToken(payload);

    //update user with refresh token in database
    await this.usersService.updateUserToken(refresh_token, _id);

    //set refresh token in cookie
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRES')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        address: address || '',
        phoneNumber: phoneNumber || '',
        avatar: avatar || '',
        role: {
          name: role.name,
          permissions: role.permissions,
        },
      },
    };
  }

  createRefreshToken = (payload: any) => {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRES')) / 1000,
    });

    return refreshToken;
  };
}
