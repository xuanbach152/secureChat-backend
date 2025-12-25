import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

// Interface cho instance methods
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User extends Document implements IUserMethods {
  @Prop({
    required: [true, 'Email là bắt buộc'],
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Email không hợp lệ'],
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({
    required: [true, 'Username là bắt buộc'],
    unique: true,
    trim: true,
  })
  username!: string;

  @Prop({
    required: false,
    select: false,
  })
  password?: string;

  @Prop({ trim: true })
  displayName!: string;

  @Prop({ type: String, default: null })
  avatarUrl?: string;

  @Prop({
    type: String,
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider!: string;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    select: false,
  })
  googleId?: string;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({
    type: String,
    select: false,
    default: null,
  })
  verificationOtp?: string;

  @Prop({
    type: Date,
    select: false,
    default: null,
  })
  verificationOtpExpires?: Date;

  @Prop({
    type: String,
    default: null,
  })
  ecdhPublicKey?: string;

  @Prop({
    type: String,
    default: null,
  })
  ecdsaPublicKey?: string;

  @Prop({
    type: Date,
    default: null,
  })
  keysUpdatedAt?: Date;

  @Prop({ default: false })
  isOnline!: boolean;

  @Prop({ default: () => new Date() })
  lastSeen!: Date;

  // Method implementation sẽ được thêm vào schema
  comparePassword!: (candidatePassword: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('name').get(function () {
  return this.displayName || this.username;
});

UserSchema.pre<User>('save', async function (next) {
  if (
    !this.isModified('password') ||
    !this.password ||
    (this.authProvider as AuthProvider) !== AuthProvider.LOCAL
  ) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

UserSchema.methods.comparePassword = function (
  candidatePassword: string,
): Promise<boolean> {
  const user = this as User;

  if (
    (user.authProvider as AuthProvider) !== AuthProvider.LOCAL ||
    !user.password
  ) {
    return Promise.resolve(false);
  }
  return bcrypt.compare(candidatePassword, user.password);
};
