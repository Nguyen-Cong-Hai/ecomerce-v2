import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  sendEmailForgotPassword = async (
    email: string,
    name: string,
    resetlink: string,
  ) => {
    await this.mailerService.sendMail({
      from: this.configService.get<string>('MAIL_ACCOUNT'),
      to: email,
      subject: 'Reset Password',
      template: './forgot-password',
      context: {
        resetlink: resetlink,
        name: name,
      },
    });
  };
}
