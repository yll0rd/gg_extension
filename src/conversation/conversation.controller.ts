import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve conversations for a user' })
  @ApiResponse({ status: 200, description: 'List of conversations' })
  findAll(@Query('userId') userId: number) {
    return this.conversationService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a specific conversation' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  findOne(
    @Param('id') id: number, 
    @Query('userId') userId: number
  ) {
    return this.conversationService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation updated successfully' })
  update(
    @Param('id') id: number, 
    @Query('userId') userId: number,
    @Body() updateConversationDto: UpdateConversationDto
  ) {
    return this.conversationService.update(id, userId, updateConversationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiResponse({ status: 200, description: 'Conversation deleted successfully' })
  remove(
    @Param('id') id: number, 
    @Query('userId') userId: number
  ) {
    return this.conversationService.remove(id, userId);
  }
}