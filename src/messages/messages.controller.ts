import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get(':otherUserId')
  async getMessages(
    @Request() req: RequestWithUser,
    @Param('otherUserId') otherUserId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
  ) {
    const userId = req.user.sub;
    const messages = await this.messagesService.getMessagesByRoom(
      userId,
      otherUserId,
      limit,
      skip,
    );
    return {
      messages,
      count: messages.length,
      limit,
      skip,
    };
  }

  @Get('unread/count')
  async getUnreadCount(@Request() req: RequestWithUser) {
    const userId = req.user.sub;
    const count = await this.messagesService.getUnreadCount(userId);
    return { unreadCount: count };
  }
}
