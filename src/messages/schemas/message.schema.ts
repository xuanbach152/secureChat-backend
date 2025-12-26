import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class Message extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiverId: Types.ObjectId;

  @Prop({ type: String, required: true })
  roomId: string;

  @Prop({ type: String, required: true })
  encryptedContent: string;

  @Prop({ type: String, default: null })
  iv: string;

  @Prop({ type: String, default: null })
  signature: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ roomId: 1, createdAt: 1 });

MessageSchema.index({ receiverId: 1, isRead: 1 });

export type MessageDocument = Message & Document;
