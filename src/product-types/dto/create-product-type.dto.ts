import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProductTypeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  slug: string;
}
