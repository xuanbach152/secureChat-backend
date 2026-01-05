import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SessionsService } from 'src/sessions/sessions.service';
import { WsException } from '@nestjs/websockets';

interface SocketData {
  userId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ClientToServerEvents {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ServerToClientEvents {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface InterServerEvents {}

type AuthSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for development
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private sessionsService: SessionsService,
  ) {}
  async handleConnection(client: AuthSocket) {
    try {
      const auth = client.handshake.auth as { token?: string };

      const token = auth.token;
      if (!token) throw new UnauthorizedException();

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.userId = payload.sub;

      await this.usersService.updateOnlineStatus(payload.sub, true);

      console.log('User connected:', payload.sub);
    } catch (err) {
      console.log(err);
      client.disconnect();
    }
  }
  async handleDisconnect(client: AuthSocket) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.usersService.updateOnlineStatus(userId, false);

    console.log('User disconnected:', userId);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { otherUserId: string },
  ) {
    const userId = client.data.userId;

    const roomId = this.messagesService.getRoomId(userId, data.otherUserId);

    await client.join(roomId);

    return { roomId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const senderId = client.data.userId;

    try {
      await this.sessionsService.getSessionById(senderId, dto.sessionId);
    } catch (error) {
      console.log(error);
      throw new WsException('Session not found or expired');
    }
    const message = await this.messagesService.createMessage(senderId, dto);

    const roomId = message.roomId;

    this.server.to(roomId).emit('newMessage', message);

    return { success: true };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { senderId: string },
  ) {
    const receiverId = client.data.userId;

    await this.messagesService.markMessagesAsRead(receiverId, data.senderId);

    const roomId = this.messagesService.getRoomId(receiverId, data.senderId);

    this.server.to(roomId).emit('messagesRead', {
      by: receiverId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { receiverId: string },
  ) {
    const senderId = client.data.userId;

    const roomId = this.messagesService.getRoomId(senderId, data.receiverId);

    this.server.to(roomId).emit('userTyping', {
      userId: senderId,
    });
  }
}
