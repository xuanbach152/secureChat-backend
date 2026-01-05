import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageKeyInfoDto } from './messages-key-info';

export class SendMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  receiverId: string;

  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  encryptedContent: string;

  @IsNotEmpty()
  @IsString()
  iv: string;

  @IsNotEmpty()
  @IsString()
  signature: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageKeyInfoDto)
  messageKeyInfo: MessageKeyInfoDto;
}
