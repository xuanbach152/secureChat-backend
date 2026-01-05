import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SessionResponseDto {
  @Expose()
  sessionId!: string;

  @Expose()
  myUserId!: string;

  @Expose()
  otherUserId!: string;

  @Expose()
  myEcdhPublicKey!: string; // My ECDH public key

  @Expose()
  myEcdhSignature!: string; // My ECDSA signature of ECDH key

  @Expose()
  theirEcdhPublicKey!: string; // Their ECDH public key

  @Expose()
  theirEcdhSignature!: string; // Their ECDSA signature of ECDH key

  @Expose()
  theirEcdsaPublicKey!: string; // Their permanent ECDSA key để verify signature

  @Expose()
  createdAt!: Date;

  @Expose()
  expiresAt!: Date;

  @Expose()
  isNew!: boolean; // True if just created, false if existing
}
