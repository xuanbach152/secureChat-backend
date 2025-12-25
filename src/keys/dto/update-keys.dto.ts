import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateKeysDto {
  @IsNotEmpty({ message: 'ECDH public key không được để trống' })
  @IsString()
  ecdhPublicKey!: string;

  @IsNotEmpty({ message: 'ECDSA public key không được để trống' })
  @IsString()
  ecdsaPublicKey!: string;
}
