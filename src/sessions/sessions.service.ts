import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserSession } from '../users/schemas/user.schema';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { plainToInstance } from 'class-transformer';
import { randomBytes, createVerify } from 'crypto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private generateSessionId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    const timestamp = Date.now();
    const random = randomBytes(16).toString('hex');
    return `${sorted[0]}_${sorted[1]}_${timestamp}_${random}`;
  }

  private calculateExpiresAt(createdAt: Date): Date {
    const expires = new Date(createdAt);
    expires.setDate(expires.getDate() + 2);
    return expires;
  }

  private verifyEcdhSignature(
    ecdhPublicKey: string,
    signature: string,
    ecdsaPublicKey: string,
  ) {
    try {
      const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${ecdsaPublicKey}\n-----END PUBLIC KEY-----`;

      const signatureBuffer = Buffer.from(signature, 'base64');

      const verifier = createVerify('SHA256');
      verifier.update(ecdhPublicKey);
      verifier.end();

      return verifier.verify(publicKeyPem, signatureBuffer);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  private async findActiveSession(
    userId: string,
    otherUserId: string,
  ): Promise<UserSession | null> {
    const user = await this.userModel.findById(userId);
    if (!user) return null;

    const now = new Date();

    const activeSession = user.sessions.find(
      (session) =>
        session.otherUserId.toString() === otherUserId &&
        session.expiresAt > now,
    );

    return activeSession || null;
  }

  async getOrCreateSession(
    myUserId: string,
    dto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    const { otherUserId, ecdhPublicKey, ecdhSignature } = dto;

    if (myUserId === otherUserId) {
      throw new BadRequestException('Cannot create session with yourself');
    }

    const myUser = await this.userModel.findById(myUserId);
    if (!myUser || !myUser.ecdsaPublicKey) {
      throw new UnauthorizedException('Your ECDSA key not found');
    }

    const otherUser = await this.userModel.findById(otherUserId);
    if (!otherUser) {
      throw new NotFoundException('Other user not found');
    }
    if (!otherUser.ecdsaPublicKey) {
      throw new BadRequestException(
        'Other user has not set up encryption keys',
      );
    }

    const isValidSignature = this.verifyEcdhSignature(
      ecdhPublicKey,
      ecdhSignature,
      myUser.ecdsaPublicKey,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException(
        'Invalid ECDSA signature for ECDH public key',
      );
    }

    const myActiveSession = await this.findActiveSession(myUserId, otherUserId);
    const otherActiveSession = await this.findActiveSession(
      otherUserId,
      myUserId,
    );

    if (
      myActiveSession &&
      otherActiveSession &&
      myActiveSession.sessionId === otherActiveSession.sessionId
    ) {
      console.log(` Returning existing session: ${myActiveSession.sessionId}`);

      return plainToInstance(SessionResponseDto, {
        sessionId: myActiveSession.sessionId,
        myUserId,
        otherUserId,
        myEcdhPublicKey: myActiveSession.ecdhPublicKey,
        myEcdhSignature: myActiveSession.ecdhSignature,
        theirEcdhPublicKey: otherActiveSession.ecdhPublicKey,
        theirEcdhSignature: otherActiveSession.ecdhSignature,
        theirEcdsaPublicKey: otherUser.ecdsaPublicKey,
        createdAt: myActiveSession.createdAt,
        expiresAt: myActiveSession.expiresAt,
        isNew: false,
      });
    }

    if (myActiveSession || otherActiveSession) {
      console.warn(
        ` Cleaning up mismatched sessions between ${myUserId} and ${otherUserId}`,
      );

      if (myActiveSession) {
        await this.userModel.findByIdAndUpdate(myUserId, {
          $pull: {
            sessions: { otherUserId: new Types.ObjectId(otherUserId) },
          },
        });
      }

      if (
        otherActiveSession &&
        (!myActiveSession ||
          myActiveSession.sessionId !== otherActiveSession.sessionId)
      ) {
        await this.userModel.findByIdAndUpdate(otherUserId, {
          $pull: { sessions: { otherUserId: new Types.ObjectId(myUserId) } },
        });
      }
    }

    const now = new Date();
    const sessionId = this.generateSessionId(myUserId, otherUserId);
    const expiresAt = this.calculateExpiresAt(now);

    const newSession: UserSession = {
      sessionId,
      otherUserId: new Types.ObjectId(otherUserId),
      ecdhPublicKey,
      ecdhSignature,
      createdAt: now,
      expiresAt,
    };

    await this.userModel.findByIdAndUpdate(
      myUserId,
      { $push: { sessions: newSession } },
      { runValidators: true },
    );

    console.log(` Created new session: ${sessionId}`);

    const refreshedOtherSession = await this.findActiveSession(
      otherUserId,
      myUserId,
    );

    return plainToInstance(SessionResponseDto, {
      sessionId,
      myUserId,
      otherUserId,
      myEcdhPublicKey: ecdhPublicKey,
      myEcdhSignature: ecdhSignature,
      theirEcdhPublicKey: refreshedOtherSession?.ecdhPublicKey || '',
      theirEcdhSignature: refreshedOtherSession?.ecdhSignature || '',
      theirEcdsaPublicKey: otherUser.ecdsaPublicKey,
      createdAt: now,
      expiresAt,
      isNew: true,
    });
  }

  async getSessionById(
    userId: string,
    sessionId: string,
  ): Promise<SessionResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const session = user.sessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      throw new NotFoundException(
        'Session not found or you are not a participant',
      );
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('Session has expired');
    }

    const otherUser = await this.userModel.findById(session.otherUserId);
    if (!otherUser) {
      throw new NotFoundException('Other participant not found');
    }

    const otherSession = otherUser.sessions.find(
      (s) => s.sessionId === sessionId,
    );

    return plainToInstance(SessionResponseDto, {
      sessionId: session.sessionId,
      myUserId: userId,
      otherUserId: session.otherUserId.toString(),
      myEcdhPublicKey: session.ecdhPublicKey,
      myEcdhSignature: session.ecdhSignature,
      theirEcdhPublicKey: otherSession?.ecdhPublicKey || '',
      theirEcdhSignature: otherSession?.ecdhSignature || '',
      theirEcdsaPublicKey: otherUser.ecdsaPublicKey || '',
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isNew: false,
    });
  }

  async rotateSession(
    userId: string,
    sessionId: string,
    dto: { newEcdhPublicKey: string; newEcdhSignature: string },
  ): Promise<SessionResponseDto> {
    const { newEcdhPublicKey, newEcdhSignature } = dto;

    const user = await this.userModel.findById(userId);
    if (!user || !user.ecdsaPublicKey) {
      throw new NotFoundException('User or ECDSA key not found');
    }

    const oldSession = user.sessions.find((s) => s.sessionId === sessionId);
    if (!oldSession) {
      throw new NotFoundException('Session not found');
    }

    // Verify new signature
    const isValidSignature = this.verifyEcdhSignature(
      newEcdhPublicKey,
      newEcdhSignature,
      user.ecdsaPublicKey,
    );

    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid signature for new ECDH key');
    }

    // Create new session with NEW sessionId
    const now = new Date();
    const newSessionId = this.generateSessionId(
      userId,
      oldSession.otherUserId.toString(),
    );
    const expiresAt = this.calculateExpiresAt(now);

    const newSession: UserSession = {
      sessionId: newSessionId,
      otherUserId: oldSession.otherUserId,
      ecdhPublicKey: newEcdhPublicKey,
      ecdhSignature: newEcdhSignature,
      createdAt: now,
      expiresAt,
    };

    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $pull: { sessions: { sessionId: sessionId } },
      },
      { runValidators: true },
    );

    await this.userModel.findByIdAndUpdate(
      userId,
      {
        $push: { sessions: newSession },
      },
      { runValidators: true },
    );

    const otherUser = await this.userModel.findById(oldSession.otherUserId);
    const otherNewSession = otherUser?.sessions.find(
      (s) => s.otherUserId.toString() === userId && s.expiresAt > now,
    );

    console.log(
      ` Session rotated for user ${userId}. New sessionId: ${newSessionId}`,
    );
    console.warn(
      ` Other user must also rotate their session to match sessionId!`,
    );

    return plainToInstance(SessionResponseDto, {
      sessionId: newSessionId,
      myUserId: userId,
      otherUserId: oldSession.otherUserId.toString(),
      myEcdhPublicKey: newEcdhPublicKey,
      myEcdhSignature: newEcdhSignature,
      theirEcdhPublicKey: otherNewSession?.ecdhPublicKey || '',
      theirEcdhSignature: otherNewSession?.ecdhSignature || '',
      theirEcdsaPublicKey: otherUser?.ecdsaPublicKey || '',
      createdAt: now,
      expiresAt,
      isNew: true,
    });
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();

    const result = await this.userModel.updateMany(
      { 'sessions.expiresAt': { $lt: now } },
      { $pull: { sessions: { expiresAt: { $lt: now } } } },
    );

    console.log(`Cleaned up ${result.modifiedCount} expired sessions`);
    return result.modifiedCount;
  }

  async devGetOrCreateSessionNoVerify(
    myUserId: string,
    dto: { otherUserId: string; ecdhPublicKey: string; ecdhSignature: string },
  ): Promise<SessionResponseDto> {
    const { otherUserId, ecdhPublicKey, ecdhSignature } = dto;

    if (myUserId === otherUserId) {
      throw new BadRequestException('Cannot create session with yourself');
    }

    const myUser = await this.userModel.findById(myUserId);
    if (!myUser) {
      throw new UnauthorizedException('User not found');
    }

    const otherUser = await this.userModel.findById(otherUserId);
    if (!otherUser) {
      throw new NotFoundException('Other user not found');
    }

    const myActiveSession = await this.findActiveSession(myUserId, otherUserId);
    const otherActiveSession = await this.findActiveSession(
      otherUserId,
      myUserId,
    );

    if (
      myActiveSession &&
      otherActiveSession &&
      myActiveSession.sessionId === otherActiveSession.sessionId
    ) {
      console.log(` Returning existing session: ${myActiveSession.sessionId}`);

      return plainToInstance(SessionResponseDto, {
        sessionId: myActiveSession.sessionId,
        myUserId,
        otherUserId,
        myEcdhPublicKey: myActiveSession.ecdhPublicKey,
        myEcdhSignature: myActiveSession.ecdhSignature,
        theirEcdhPublicKey: otherActiveSession.ecdhPublicKey,
        theirEcdhSignature: otherActiveSession.ecdhSignature,
        theirEcdsaPublicKey: otherUser.ecdsaPublicKey || '',
        createdAt: myActiveSession.createdAt,
        expiresAt: myActiveSession.expiresAt,
        isNew: false,
      });
    }

    if (myActiveSession || otherActiveSession) {
      console.warn(
        ` Cleaning up mismatched sessions between ${myUserId} and ${otherUserId}`,
      );

      if (myActiveSession) {
        await this.userModel.findByIdAndUpdate(myUserId, {
          $pull: {
            sessions: { otherUserId: new Types.ObjectId(otherUserId) },
          },
        });
      }

      if (
        otherActiveSession &&
        (!myActiveSession ||
          myActiveSession.sessionId !== otherActiveSession.sessionId)
      ) {
        await this.userModel.findByIdAndUpdate(otherUserId, {
          $pull: { sessions: { otherUserId: new Types.ObjectId(myUserId) } },
        });
      }
    }

    const now = new Date();
    const sessionId = this.generateSessionId(myUserId, otherUserId);
    const expiresAt = this.calculateExpiresAt(now);

    const newSession: UserSession = {
      sessionId,
      otherUserId: new Types.ObjectId(otherUserId),
      ecdhPublicKey,
      ecdhSignature,
      createdAt: now,
      expiresAt,
    };

    await this.userModel.findByIdAndUpdate(
      myUserId,
      { $push: { sessions: newSession } },
      { runValidators: true },
    );

    console.log(` Created new session (DEV MODE): ${sessionId}`);

    const refreshedOtherSession = await this.findActiveSession(
      otherUserId,
      myUserId,
    );

    return plainToInstance(SessionResponseDto, {
      sessionId,
      myUserId,
      otherUserId,
      myEcdhPublicKey: ecdhPublicKey,
      myEcdhSignature: ecdhSignature,
      theirEcdhPublicKey: refreshedOtherSession?.ecdhPublicKey || '',
      theirEcdhSignature: refreshedOtherSession?.ecdhSignature || '',
      theirEcdsaPublicKey: otherUser.ecdsaPublicKey || '',
      createdAt: now,
      expiresAt,
      isNew: true,
    });
  }
}
