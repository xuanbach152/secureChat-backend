import { IsOptional, IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty()
  @IsMongoId()
  receiverId: string;

  @IsNotEmpty()
  @IsString()
  encryptedContent: string;

  @IsOptional()
  @IsString()
  iv?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
