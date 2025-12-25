import { Module } from '@nestjs/common';
import { UsersModule } from 'src/users/user.module';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

@Module({
  imports: [UsersModule],
  controllers: [KeysController],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
