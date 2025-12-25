import { Exclude, Expose, Transform } from 'class-transformer';
import { User } from '../schemas/user.schema';

@Exclude()
export class UserResponseDto {
  @Expose()
  @Transform(({ obj }: { obj: User }) => obj._id?.toString() ?? '')
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  username!: string;

  @Expose()
  displayName!: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  authProvider!: string;

  @Expose()
  isEmailVerified!: boolean;

  @Expose()
  isOnline!: boolean;

  @Expose()
  lastSeen!: Date;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
