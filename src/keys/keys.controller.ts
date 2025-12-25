import {
  Body,
  Get,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Param,
} from '@nestjs/common';
import { KeysService } from './keys.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateKeysDto } from './dto/update-keys.dto';
import { User } from 'src/users/schemas/user.schema';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { KeysResponseDto } from './dto/keys-response.dto';
interface RequestWithUser extends Request {
  user: User;
}
@Controller('keys')
export class KeysController {
  constructor(private readonly keysService: KeysService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateKeys(
    @Request() req: RequestWithUser,
    @Body() updateKeysDto: UpdateKeysDto,
  ): Promise<{ message: string; user: UserResponseDto }> {
    const userId = req.user._id.toString();

    const updatedUser = await this.keysService.updateUserKeys(
      userId,
      updateKeysDto,
    );

    return {
      message: 'Keys updated successfully',
      user: plainToInstance(UserResponseDto, updatedUser),
    };
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  async getUserPublicKeys(
    @Param('userId') userId: string,
  ): Promise<KeysResponseDto> {
    const userPublicKeys = await this.keysService.getUserPublicKeys(userId);
    return userPublicKeys;
  }
  @Get('check/:userId')
  @HttpCode(HttpStatus.OK)
  async checkUserHasKeys(
    @Param('userId') userId: string,
  ): Promise<{ hasKeys: boolean }> {
    const hasKeys = await this.keysService.checkUserHaskeys(userId);
    return { hasKeys: hasKeys };
  }
}
