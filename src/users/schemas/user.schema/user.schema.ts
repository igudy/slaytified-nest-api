import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: ['admin', 'user', 'manager'], default: 'user' })
  role: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  password?: string; // For bulk upload, you might want to generate a temp password or send invitation
}

export const UserSchema = SchemaFactory.createForClass(User);
