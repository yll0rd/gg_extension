import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMessagesTable1709123456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create custom ENUM type for message types
    await queryRunner.query(`
      CREATE TYPE "public"."message_type_enum" AS ENUM ('text', 'media', 'token_transfer')
    `);

    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'conversationId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'media', 'token_transfer'],
            default: "'text'",
          },
          {
            name: 'timestamp',
            type: 'timestamp with time zone',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_sender_id',
            columnNames: ['senderId'],
          },
          {
            name: 'IDX_conversation_id',
            columnNames: ['conversationId'],
          },
          {
            name: 'IDX_message_timestamp',
            columnNames: ['timestamp'],
          },
        ],
      }),
      true, // ifNotExists
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
    await queryRunner.query(`DROP TYPE "public"."message_type_enum"`);
  }
}
