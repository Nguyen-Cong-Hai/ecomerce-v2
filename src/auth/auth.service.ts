import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import ms from 'ms';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      let user = await this.usersService.findUserByToken(refreshToken);

      if (user) {
        //update refresh token
        const { _id, name, email, role, address, avatar, phoneNumber } = user;

        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          name,
          email,
          role,
        };

        const refresh_token = this.createRefreshToken(payload);

        //update user with refresh token in database
        await this.usersService.updateUserToken(refresh_token, _id.toString());

        //set refresh token in cookie
        response.clearCookie('refresh_token');

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
            role,
          },
        };
      } else {
        throw new BadRequestException(
          'Refresh token is invalid, please login again.',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        'Refresh token is invalid, please login again.',
      );
    }
  };

  logout = async (user: IUser, response: Response) => {
    await this.usersService.updateUserToken('', user._id);

    response.clearCookie('refresh_token');

    return 'Ok';
  };

  changePassword = async (data: ChangePasswordDto, user: IUser) => {
    await this.usersService.changePasswordUser(data, user._id);

    return 'Change password success';
  };

  forgotPassword = async (email: string) => {
    let checkUser = await this.usersService.findOneByUsername(email);

    if (!checkUser) {
      throw new BadRequestException('Email is not existed');
    }

    const payload = {
      sub: 'token fotgot password',
      iss: 'from server',
      email,
    };

    const forgotPasswordToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_RESET_PASSWORD'),
      expiresIn:
        ms(this.configService.get<string>('JWT_RESET_PASSWORD_EXPIRES')) / 1000,
    });

    checkUser.resetPasswordToken = forgotPasswordToken;

    const resetLink = `${this.configService.get<string>('URL_RESET_PASSWORD')}?secret=${forgotPasswordToken}`;

    await checkUser.save();

    await this.mailService.sendEmailForgotPassword(
      email,
      checkUser.name,
      resetLink,
    );

    return 'Reset password success';
  };
}
