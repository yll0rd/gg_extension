// dto/search.dto.ts
import { IsOptional, IsString, IsUUID, IsDate, IsIn, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class MessageFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by conversation ID' })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Filter messages from this date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Filter messages until this date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}

export class SearchMessageDto {
  @ApiProperty({ description: 'Search query string', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Additional filters' })
  @IsOptional()
  @Type(() => MessageFiltersDto)
  filters?: MessageFiltersDto;

  @ApiPropertyOptional({ 
    description: 'Field to sort by', 
    enum: ['createdAt', 'updatedAt', 'relevance'] 
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'relevance'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Maximum number of results', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class ConversationFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by participant ID' })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiPropertyOptional({ description: 'Filter conversations from this date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Filter conversations until this date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}

export class SearchConversationDto {
  @ApiProperty({ description: 'Search query string', required: false })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Additional filters' })
  @IsOptional()
  @Type(() => ConversationFiltersDto)
  filters?: ConversationFiltersDto;

  @ApiPropertyOptional({ 
    description: 'Field to sort by', 
    enum: ['createdAt', 'updatedAt', 'title', 'relevance'] 
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title', 'relevance'])
  sortBy?: string;

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ description: 'Maximum number of results', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Number of results to skip', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

// dto/search-result.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../messages/entities/message.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

export class MessageSearchResultDto extends Message {
  @ApiProperty({ description: 'Relevance score for the search result' })
  relevance: number;
}

export class ConversationSearchResultDto extends Conversation {
  @ApiProperty({ description: 'Relevance score for the search result' })
  relevance: number;
}
