import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateCityDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  name: string;
}
