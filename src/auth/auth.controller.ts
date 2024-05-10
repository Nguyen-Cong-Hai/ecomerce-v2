import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from 'src/users/dto/create-user.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { Response, Request } from 'express';
import { IUser } from 'src/users/users.interface';
import { ChangePasswordDto } from 'src/users/dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UseGuards(LocalAuthGuard)
  @Public()
  @ResponseMessage('User Login')
  handleLogin(@Req() req, @Res({ passthrough: true }) response: Response) {
    return this.authService.login(req.user, response);
  }

  @Post('/register')
  @Public()
  @ResponseMessage('User Register')
  handleRegister(@Body() registerUser: RegisterDto) {
    return this.authService.register(registerUser);
  }

  @Get('/account')
  @ResponseMessage('Get user information')
  handleGetAccount(@User() user: IUser) {
    return {
      user,
    };
  }

  @Get('/refresh')
  @Public()
  @ResponseMessage('Get user by refresh token')
  handleRefreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies['refresh_token'];

    return this.authService.processNewToken(refreshToken, response);
  }

  @Post('/logout')
  @ResponseMessage('Logout user')
  handleLogout(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.logout(user, response);
  }

  @Patch('/change-password')
  @ResponseMessage('Change password user')
  handleChangePassword(@Body() data: ChangePasswordDto, @User() user: IUser) {
    return this.authService.changePassword(data, user);
  }

  @Post('/forgot-password')
  @ResponseMessage('Forgot password')
  handleForgotPassword(@Body() email: string) {
    return this.authService.forgotPassword(email);
  }
}
