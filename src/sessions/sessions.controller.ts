import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RotateSessionDto } from './dto/rotate-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/schemas/user.schema';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('get-or-create')
  @HttpCode(HttpStatus.OK)
  async getOrCreateSession(
    @Request() req: RequestWithUser,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const myUserId = req.user._id.toString();
    return this.sessionsService.getOrCreateSession(myUserId, dto);
  }

  @Get(':sessionId')
  @HttpCode(HttpStatus.OK)
  async getSessionById(
    @Request() req: RequestWithUser,
    @Param('sessionId') sessionId: string,
  ): Promise<SessionResponseDto> {
    const userId = req.user._id.toString();
    return this.sessionsService.getSessionById(userId, sessionId);
  }

  @Post(':sessionId/rotate')
  @HttpCode(HttpStatus.OK)
  async rotateSession(
    @Request() req: RequestWithUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: RotateSessionDto,
  ): Promise<SessionResponseDto> {
    const userId = req.user._id.toString();
    return this.sessionsService.rotateSession(userId, sessionId, {
      newEcdhPublicKey: dto.newEcdhPublicKey,
      newEcdhSignature: dto.newEcdhSignature,
    });
  }

  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredSessions(): Promise<{ deletedCount: number }> {
    const count = await this.sessionsService.cleanupExpiredSessions();
    return { deletedCount: count };
  }

  // ===== DEVELOPMENT ONLY - Bypass signature verification =====
  @Post('dev/get-or-create-no-verify')
  @HttpCode(HttpStatus.OK)
  async devGetOrCreateSessionNoVerify(
    @Request() req: RequestWithUser,
    @Body() dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('This endpoint is only available in development');
    }
    const myUserId = req.user._id.toString();
    return this.sessionsService.devGetOrCreateSessionNoVerify(myUserId, dto);
  }
}
