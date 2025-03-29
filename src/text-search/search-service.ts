// search.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../messages/entities/message.entity';
import { Conversation } from '../conversations/entities/conversation.entity';
import { SearchMessageDto, SearchConversationDto } from './dto/search.dto';
import { MessageSearchResultDto, ConversationSearchResultDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  /**
   * Search for messages using PostgreSQL full-text search
   * @param searchDto Search parameters and filters
   * @returns Messages with relevance score
   */
  async searchMessages(searchDto: SearchMessageDto): Promise<MessageSearchResultDto[]> {
    const { query, filters, sortBy, sortOrder, limit, offset } = searchDto;
    
    // Build the search query using TypeORM and PostgreSQL's ts_vector/ts_query
    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.user', 'user')
      .leftJoinAndSelect('message.conversation', 'conversation');
    
    // Add full-text search condition
    if (query) {
      // Using to_tsvector for full-text search against message content
      // and ts_rank to calculate relevance score
      queryBuilder
        .addSelect(`ts_rank(to_tsvector('english', message.content), plainto_tsquery('english', :query))`, 'relevance')
        .where(`to_tsvector('english', message.content) @@ plainto_tsquery('english', :query)`, { query });
    } else {
      queryBuilder.addSelect('1', 'relevance');
    }
    
    // Apply additional filters
    if (filters) {
      if (filters.userId) {
        queryBuilder.andWhere('message.userId = :userId', { userId: filters.userId });
      }
      
      if (filters.conversationId) {
        queryBuilder.andWhere('message.conversationId = :conversationId', { conversationId: filters.conversationId });
      }
      
      if (filters.fromDate) {
        queryBuilder.andWhere('message.createdAt >= :fromDate', { fromDate: filters.fromDate });
      }
      
      if (filters.toDate) {
        queryBuilder.andWhere('message.createdAt <= :toDate', { toDate: filters.toDate });
      }
    }
    
    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
      if (sortBy === 'relevance' && query) {
        queryBuilder.orderBy('relevance', order);
      } else {
        queryBuilder.orderBy(`message.${sortBy}`, order);
      }
    } else if (query) {
      // Default sort by relevance if query is provided
      queryBuilder.orderBy('relevance', 'DESC');
    } else {
      // Default sort by creation date if no query
      queryBuilder.orderBy('message.createdAt', 'DESC');
    }
    
    // Apply pagination
    queryBuilder.limit(limit || 10).offset(offset || 0);
    
    // Execute the query
    const results = await queryBuilder.getRawAndEntities();
    
    // Map results to DTOs with relevance scores
    return results.entities.map((entity, index) => {
      const relevance = parseFloat(results.raw[index].relevance);
      return {
        ...entity,
        relevance: isNaN(relevance) ? 0 : relevance,
      };
    });
  }

  /**
   * Search for conversations using PostgreSQL full-text search
   * @param searchDto Search parameters and filters
   * @returns Conversations with relevance score
   */
  async searchConversations(searchDto: SearchConversationDto): Promise<ConversationSearchResultDto[]> {
    const { query, filters, sortBy, sortOrder, limit, offset } = searchDto;
    
    // Build the search query using TypeORM and PostgreSQL's ts_vector/ts_query
    const queryBuilder = this.conversationRepository.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participants');
    
    // Add full-text search condition
    if (query) {
      // Using to_tsvector for full-text search against title and description
      // and ts_rank to calculate relevance score
      queryBuilder
        .addSelect(`ts_rank(to_tsvector('english', conversation.title || ' ' || COALESCE(conversation.description, '')), plainto_tsquery('english', :query))`, 'relevance')
        .where(`to_tsvector('english', conversation.title || ' ' || COALESCE(conversation.description, '')) @@ plainto_tsquery('english', :query)`, { query });
    } else {
      queryBuilder.addSelect('1', 'relevance');
    }
    
    // Apply additional filters
    if (filters) {
      if (filters.participantId) {
        queryBuilder.andWhere('participants.id = :participantId', { participantId: filters.participantId });
      }
      
      if (filters.fromDate) {
        queryBuilder.andWhere('conversation.createdAt >= :fromDate', { fromDate: filters.fromDate });
      }
      
      if (filters.toDate) {
        queryBuilder.andWhere('conversation.createdAt <= :toDate', { toDate: filters.toDate });
      }
    }
    
    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
      if (sortBy === 'relevance' && query) {
        queryBuilder.orderBy('relevance', order);
      } else {
        queryBuilder.orderBy(`conversation.${sortBy}`, order);
      }
    } else if (query) {
      // Default sort by relevance if query is provided
      queryBuilder.orderBy('relevance', 'DESC');
    } else {
      // Default sort by creation date if no query
      queryBuilder.orderBy('conversation.createdAt', 'DESC');
    }
    
    // Apply pagination
    queryBuilder.limit(limit || 10).offset(offset || 0);
    
    // Execute the query
    const results = await queryBuilder.getRawAndEntities();
    
    // Map results to DTOs with relevance scores
    return results.entities.map((entity, index) => {
      const relevance = parseFloat(results.raw[index].relevance);
      return {
        ...entity,
        relevance: isNaN(relevance) ? 0 : relevance,
      };
    });
  }
}
