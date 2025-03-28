import { Module } from '@nestjs/common';
import { MessageProviderTsService } from './providers/message-provider.ts.service';

@Module({
  providers: [MessageProviderTsService]
})
export class MessagesModule {}
