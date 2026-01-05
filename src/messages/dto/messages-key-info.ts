import { IsNotEmpty, IsString } from 'class-validator';

export class MessageKeyInfoDto {
  @IsNotEmpty()
  @IsString()
  messageId: string;

  @IsNotEmpty()
  @IsString()
  nonce: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;
}
