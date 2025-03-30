// migrations/1710925500000-AddFullTextSearchIndexes.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFullTextSearchIndexes1710925500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add GIN indexes for full-text search on Message content
    await queryRunner.query(`
      -- Create a tsvector column for message content
      ALTER TABLE messages ADD COLUMN content_tsv tsvector;

      -- Create a trigger to automatically update the tsvector column when content is updated
      CREATE OR REPLACE FUNCTION messages_tsvector_update_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.content_tsv := to_tsvector('english', NEW.content);
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER tsvector_update_messages_trigger BEFORE INSERT OR UPDATE
      ON messages FOR EACH ROW EXECUTE FUNCTION messages_tsvector_update_trigger();

      -- Update existing records
      UPDATE messages SET content_tsv = to_tsvector('english', content);

      -- Create a GIN index on the tsvector column for fast full-text search
      CREATE INDEX messages_content_tsv_idx ON messages USING GIN(content_tsv);
    `);

    // Add GIN indexes for full-text search on Conversation title and description
    await queryRunner.query(`
      -- Create a tsvector column for conversations
      ALTER TABLE conversations ADD COLUMN text_search_tsv tsvector;

      -- Create a trigger to automatically update the tsvector column
      CREATE OR REPLACE FUNCTION conversations_tsvector_update_trigger() RETURNS trigger AS $$
      BEGIN
        NEW.text_search_tsv := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.description, ''));
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER tsvector_update_conversations_trigger BEFORE INSERT OR UPDATE
      ON conversations FOR EACH ROW EXECUTE FUNCTION conversations_tsvector_update_trigger();

      -- Update existing records
      UPDATE conversations SET text_search_tsv = to_tsvector('english', title || ' ' || COALESCE(description, ''));

      -- Create a GIN index on the tsvector column for fast full-text search
      CREATE INDEX conversations_text_search_tsv_idx ON conversations USING GIN(text_search_tsv);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove triggers, functions, and columns for messages
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS tsvector_update_messages_trigger ON messages;
      DROP INDEX IF EXISTS messages_content_tsv_idx;
      DROP FUNCTION IF EXISTS messages_tsvector_update_trigger();
      ALTER TABLE messages DROP COLUMN IF EXISTS content_tsv;
    `);

    // Remove triggers, functions, and columns for conversations
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS tsvector_update_conversations_trigger ON conversations;
      DROP INDEX IF EXISTS conversations_text_search_tsv_idx;
      DROP FUNCTION IF EXISTS conversations_tsvector_update_trigger();
      ALTER TABLE conversations DROP COLUMN IF EXISTS text_search_tsv;
    `);
  }
}
