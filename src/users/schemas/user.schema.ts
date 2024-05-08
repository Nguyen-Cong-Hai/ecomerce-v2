import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Role } from 'src/roles/schemas/role.schema';

export type UserDocument = HydratedDocument<User>;

class Addresses {
  @Prop()
  price: number;

  @Prop()
  city: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  name: string;

  @Prop()
  discount: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Product' })
  product: string;
}

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Role.name })
  role: string;

  @Prop()
  phoneNumber: string;

  @Prop()
  address: string;

  @Prop()
  avatar: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'City' })
  city: string;

  @Prop({ type: Number, enum: [0, 1], default: 1 })
  status: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] })
  likedProducts: string[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] })
  viewedProducts: string[];

  @Prop({ type: Number, enum: [1, 2, 3], default: 3 })
  userType: number;

  @Prop({ type: [Addresses] })
  addresses: Addresses[];
}

export const UserSchema = SchemaFactory.createForClass(User);
