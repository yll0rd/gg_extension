import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { SeedCommand } from './commands/seed.command';
import typeormConfig from './config/typeorm.config';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { UserSeedService } from './database/seeds/user.seed';
import { ConsoleModule } from 'nestjs-console';

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
  ],
  providers: [SeedCommand, UserSeedService],
})
export class AppModule {}
