import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { TelegramInitDataService } from './telegram-init-data.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenService, TelegramInitDataService],
  exports: [TokenService, TelegramInitDataService],
})
export class AuthModule {}
