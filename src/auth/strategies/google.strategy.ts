import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfile } from '../interfaces/google-profile.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('google.clientID') || '',
      clientSecret: configService.get<string>('google.clientSecret') || '',
      callbackURL: configService.get<string>('google.callbackURL') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    if (!profile.emails || profile.emails.length === 0) {
      done(
        new UnauthorizedException('No email found in Google profile'),
        undefined,
      );
      return;
    }

    const email = profile.emails[0].value;
    if (!email) {
      done(new UnauthorizedException('Invalid email from Google'), undefined);
      return;
    }

    const googleUser: GoogleProfile = {
      googleId: profile.id,
      email: email,
      displayName: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value || null,
    };

    done(null, googleUser);
  }
}
