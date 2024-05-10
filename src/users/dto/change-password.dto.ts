import { IsNotEmpty, IsString, Max, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}
