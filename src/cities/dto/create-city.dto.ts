import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}
