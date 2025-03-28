import { Module } from '@nestjs/common';
import { MessageService } from './providers/message-provider.ts.service';

@Module({
  controllers: [],
  providers: [MessageService],
})
export class MessagesModule {}
