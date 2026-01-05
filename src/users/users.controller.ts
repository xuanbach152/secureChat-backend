import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './schemas/user.schema';
import { plainToInstance } from 'class-transformer';
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<UserResponseDto> {
    const userId = req.user._id.toString();
    const user = await this.usersService.findById(userId);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userId = req.user._id.toString();
    const updatedUser = await this.usersService.updateUser(
      userId,
      updateUserDto,
    );
    return plainToInstance(UserResponseDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('online')
  async getOnlineUsers(
    @Request() req: RequestWithUser,
  ): Promise<UserResponseDto[]> {
    const currentUserId = req.user._id.toString();
    const users = await this.usersService.findOnlineUsers(currentUserId);
    return users.map((user) =>
      plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
