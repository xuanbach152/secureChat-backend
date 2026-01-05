import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { MessagesController } from './messages.controller';

import { Message, MessageSchema } from './schemas/message.schema';
import { UsersModule } from '../users/user.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),

    UsersModule,
    SessionsModule,

    JwtModule.register({}),
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
