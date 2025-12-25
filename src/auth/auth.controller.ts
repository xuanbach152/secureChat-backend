import {
  Controller,
  Get,
  Response,
  Body,
  UseGuards,
  Request,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/schemas/user.schema';
import { GoogleProfile } from './interfaces/google-profile.interface';

interface RequestWithUser extends Request {
  user: User;
}

interface RequestWithGoogleProfile extends Request {
  user: GoogleProfile;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard will handle redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(
    @Request() req: RequestWithGoogleProfile,
    @Response() res: ExpressResponse,
  ) {
    const { accessToken } = await this.authService.googleLogin(req.user);

    const frontendUrl =
      this.configService.get<string>('frontendUrl') || 'http://localhost:5173';

    return res.redirect(`${frontendUrl}?token=${accessToken}`);
  }
}
