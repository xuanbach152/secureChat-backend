import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { SendMessageDto } from './dto/send-message.dto';
@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  getRoomId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('-');
  }

  async createMessage(senderId: string, dto: SendMessageDto) {
    const roomId = this.getRoomId(senderId, dto.receiverId);

    const message = await this.messageModel.create({
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(dto.receiverId),
      roomId,
      encryptedContent: dto.encryptedContent,
      iv: dto.iv || null,
      signature: dto.signature || null,
      isRead: false,
    });
    return message.populate([
      { path: 'senderId', select: 'username displayName avatarUrl' },
      { path: 'receiverId', select: 'username displayName avatarUrl' },
    ]);
  }

  async getMessagesByRoom(
    userId1: string,
    userId2: string,
    limit = 20,
    skip = 0,
  ) {
    const roomId = this.getRoomId(userId1, userId2);
    return this.messageModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'senderId', select: 'username displayName avatarUrl' },
        { path: 'receiverId', select: 'username displayName avatarUrl' },
      ])
      .exec();
  }

  async markMessagesAsRead(receiverId: string, senderId: string) {
    const roomId = this.getRoomId(receiverId, senderId);
    return this.messageModel.updateMany(
      {
        roomId,
        receiverId: new Types.ObjectId(receiverId),
        isRead: false,
      },
      {
        $set: { isRead: true },
      },
    );
  }
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageModel.countDocuments({
      receiverId: new Types.ObjectId(userId),
      isRead: false,
    });
  }
}
