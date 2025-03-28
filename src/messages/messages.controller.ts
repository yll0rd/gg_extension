import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageFilterDto } from './dto/message-filter.dto';
import { MessagesService } from './providers/messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  @Post()
  createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.createMessage(createMessageDto);
  }

  @Get('conversation/:conversationId')
  findMessagesByConversation(
    @Param('conversationId') conversationId: string,
    @Query() filterDto: MessageFilterDto,
  ) {
    return this.messageService.findMessages(conversationId, filterDto);
  }

  @Get(':id')
  findMessageById(@Param('id') id: string) {
    return this.messageService.findMessageById(id);
  }

  @Put(':id')
  updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messageService.updateMessage(id, updateMessageDto);
  }

  @Delete(':id')
  deleteMessage(@Param('id') id: string) {
    return this.messageService.deleteMessage(id);
  }
}
