import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { UsersModule } from 'src/users/users.module';
import { MessageConversionService } from './providers/message-provider.ts.service';
import { MessagesService } from './providers/messages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UsersModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessageConversionService],
})
export class MessagesModule {}
