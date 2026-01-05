import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface MessageKeyInfo {
  messageId: string;
  nonce: string;
  sessionId: string;
}

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
  sessionId: string;

  @Prop({ type: String, required: true })
  encryptedContent: string;

  @Prop({ type: String, required: true })
  iv: string;

  @Prop({ type: String, required: true })
  signature: string;

  @Prop({
    type: {
      messageId: { type: String, required: true },
      nonce: { type: String, required: true },
      sessionId: { type: String, required: true },
    },
    required: true,
  })
  messageKeyInfo: MessageKeyInfo;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date })
  expiresAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ roomId: 1, createdAt: 1 });

MessageSchema.index({ receiverId: 1, isRead: 1 });

MessageSchema.index({ sessionId: 1, createdAt: 1 });

MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type MessageDocument = Message & Document;
