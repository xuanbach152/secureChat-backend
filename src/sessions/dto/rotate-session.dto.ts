import { IsNotEmpty, IsString } from 'class-validator';

export class RotateSessionDto {
  @IsNotEmpty()
  @IsString()
  newEcdhPublicKey!: string; // New ECDH public key

  @IsNotEmpty()
  @IsString()
  newEcdhSignature!: string;
}
