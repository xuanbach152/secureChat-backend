import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from 'src/users/dto/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { User } from 'src/users/schemas/user.schema';
import { GoogleProfile } from './interfaces/google-profile.interface';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(registerDto);
    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      accessToken,
      user: plainToInstance(UserResponseDto, user),
    };
  }
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: plainToInstance(UserResponseDto, user),
    };
  }
  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(identifier);

    if (!user) return null;
    if (user.authProvider !== 'local') return null;

    try {
      const isValid = await user.comparePassword(password);
      if (!isValid) return null;
    } catch {
      return null;
    }

    return user;
  }

  async validateJwtPayload(payload: { sub: string }): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    return user;
  }
  async googleLogin(googleUser: GoogleProfile): Promise<AuthResponseDto> {
    const user = await this.usersService.findOrCreateGoogleUser(googleUser);
    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: plainToInstance(UserResponseDto, user),
    };
  }
}
