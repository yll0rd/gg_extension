import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { SeedCommand } from './commands/seed.command';
import typeormConfig from './config/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { UserSeedService } from './database/seeds/user.seed';
import { ConsoleModule } from 'nestjs-console';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { ConversionModule } from './conversion/conversion.module';
import { MessagesModule } from './messages/messages.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    ConsoleModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeormConfig),
    TypeOrmModule.forFeature([User]),
    UsersModule,
    AuthModule,
    WalletModule
    ConversionModule,
    MessagesModule,
    ConversationModule,
  ],
  providers: [SeedCommand, UserSeedService],
})
export class AppModule {}
