import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @IsString()
  otherUserId!: string;

  @IsNotEmpty()
  @IsString()
  ecdhPublicKey!: string; // My ephemeral ECDH public key

  @IsNotEmpty()
  @IsString()
  ecdhSignature!: string; // ECDSA signature of ecdhPublicKey
}
