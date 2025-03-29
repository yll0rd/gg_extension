// src/token/token.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { StarknetService } from './services/starknet.service';
import { TokenTransaction } from './entities/token-transaction.entity';
import { TokenRepository } from './repositories/token.repository';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TokenTransaction]),
    ConfigModule,
    UserModule
  ],
  controllers: [TokenController],
  providers: [
    TokenService,
    StarknetService,
    TokenRepository
  ],
  exports: [TokenService, StarknetService]
})
export class TokenModule {}
