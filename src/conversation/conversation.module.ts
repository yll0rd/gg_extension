import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConversationEntity } from './entities/conversation.entity';
import { ConversationRepository } from './repositories/conversation.repository';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationEntity])
  ],
  controllers: [ConversationController],
  providers: [
    ConversationService, 
    ConversationRepository
  ],
  exports: [ConversationService]
})
export class ConversationModule {}