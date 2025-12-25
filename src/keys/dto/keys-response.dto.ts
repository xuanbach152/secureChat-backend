import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class KeysResponseDto {
  @Expose()
  userId!: string;

  @Expose()
  ecdhPublicKey!: string | null;

  @Expose()
  ecdsaPublicKey!: string | null;

  @Expose()
  keysUpdatedAt!: Date | null;
}
