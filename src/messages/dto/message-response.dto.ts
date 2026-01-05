import { Exclude, Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';
@Exclude()
export class MessageResponseDto {
  @Expose()
  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  _id: string;

  @Expose()
  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  senderId: string;

  @Expose()
  @Transform(({ value }: { value: Types.ObjectId }) => value.toString())
  receiverId: string;

  @Expose()
  roomId: string;

  @Expose()
  encryptedContent: string;

  @Expose()
  iv?: string;

  @Expose()
  signature?: string;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  sessionId: string;

  @Expose()
  messageKeyInfo: {
    messageId: string;
    nonce: string;
    sessionId: string;
  };

  @Expose()
  expiresAt?: Date;
}
