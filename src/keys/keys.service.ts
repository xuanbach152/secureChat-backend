import { Injectable } from '@nestjs/common';
import { UpdateKeysDto } from './dto/update-keys.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/schemas/user.schema';
import { KeysResponseDto } from './dto/keys-response.dto';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class KeysService {
  constructor(private usersService: UsersService) {}
  async updateUserKeys(
    userId: string,
    updateKeysDto: UpdateKeysDto,
  ): Promise<User> {
    const user = await this.usersService.updateKeys(
      userId,
      updateKeysDto.ecdhPublicKey,
      updateKeysDto.ecdsaPublicKey,
    );
    return user;
  }
  async getUserPublicKeys(userId: string): Promise<KeysResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToInstance(KeysResponseDto, {
      userId: user._id.toString(),
      ecdhPublicKey: user.ecdhPublicKey ?? null,
      ecdsaPublicKey: user.ecdsaPublicKey ?? null,
      keysUpdatedAt: user.keysUpdatedAt ?? null,
    });
  }
  async checkUserHaskeys(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user.ecdhPublicKey) {
      return false;
    }
    if (!user.ecdsaPublicKey) {
      return false;
    }
    return true;
  }
}
