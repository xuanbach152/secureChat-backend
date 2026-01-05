import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User, AuthProvider } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { GoogleProfile } from '../auth/interfaces/google-profile.interface';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, username, password, displayName } = createUserDto;
    const existingEmail = await this.userModel.findOne({ email });
    if (existingEmail) {
      throw new ConflictException('Email đã tồn tại');
    }
    const existingUserName = await this.userModel.findOne({ username });
    if (existingUserName) {
      throw new ConflictException('UserName đã tồn tại');
    }
    const user = new this.userModel({
      email,
      username,
      password,
      displayName: displayName || username,
      authProvider: AuthProvider.LOCAL,
      isEmailVerified: false,
    });
    await user.save();
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password')
      .exec();
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('Không tìm thấy user!');
    }
    return user;
  }

  async findOrCreateGoogleUser(googleProfile: GoogleProfile): Promise<User> {
    const { googleId, email, displayName, avatarUrl } = googleProfile;
    let user = await this.userModel.findOne({ googleId }).exec();
    if (user) {
      user.displayName = displayName;
      if (avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
      await user.save();
      return user;
    }
    const existingEmailUser = await this.userModel.findOne({ email }).exec();

    if (existingEmailUser) {
      throw new ConflictException(
        'Email đã được sử dụng với phương thức đăng nhập khác',
      );
    }
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;

    while (await this.userModel.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    user = new this.userModel({
      email,
      username,
      displayName,
      avatarUrl,
      googleId,
      authProvider: AuthProvider.GOOGLE,
      isEmailVerified: true,
    });

    await user.save();

    return user;
  }
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException('User không tồn tại');
    }

    return user;
  }
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? new Date() : new Date(),
    });
  }

  async findOnlineUsers(excludeUserId: string): Promise<User[]> {
    return this.userModel
      .find({
        _id: { $ne: excludeUserId },
        isOnline: true,
      })
      .select('_id email username displayName avatarUrl isOnline')
      .exec();
  }

  async updateKeys(
    userId: string,
    ecdhPublicKey: string,
    ecdsaPublicKey: string,
  ): Promise<User> {
    const result = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          ecdhPublicKey,
          ecdsaPublicKey,
          keysUpdatedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('User không tồn tại');
    }
    return result;
  }
}
