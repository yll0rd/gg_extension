// src/migrations/1650123456789-CreateTokenTransactionTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';
import { TokenType, TransactionStatus } from '../token-transactions/enums';

export class CreateTokenTransactionTable1650123456789 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for token_type and status
    await queryRunner.query(`
      CREATE TYPE "token_type_enum" AS ENUM (
        '${TokenType.ERC20}',
        '${TokenType.ERC721}',
        '${TokenType.ERC1155}'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "transaction_status_enum" AS ENUM (
        '${TransactionStatus.PENDING}',
        '${TransactionStatus.CONFIRMED}',
        '${TransactionStatus.FAILED}',
        '${TransactionStatus.REVERTED}',
        '${TransactionStatus.CANCELLED}'
      )
    `);

    // Create token_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'token_transactions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'sender_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'receiver_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'token_type',
            type: 'token_type_enum',
            isNullable: false,
          },
          {
            name: 'token_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'token_address',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 36,
            scale: 18,
            default: 0,
          },
          {
            name: 'tx_hash',
            type: 'varchar',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'status',
            type: 'transaction_status_enum',
            default: `'${TransactionStatus.PENDING}'`,
          },
          {
            name: 'blockchain',
            type: 'varchar',
            default: `'ethereum'`,
          },
          {
            name: 'gas_price',
            type: 'decimal',
            precision: 36,
            scale: 18,
            isNullable: true,
          },
          {
            name: 'gas_used',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'transaction_fee',
            type: 'decimal',
            precision: 36,
            scale: 18,
            isNullable: true,
          },
          {
            name: 'block_number',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'block_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_sender',
        columnNames: ['sender_id'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_receiver',
        columnNames: ['receiver_id'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_token_type',
        columnNames: ['token_type'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_token_id',
        columnNames: ['token_id'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_tx_hash',
        columnNames: ['tx_hash'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_status',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_created_at',
        columnNames: ['created_at'],
      })
    );

    // Composite index for common queries
    await queryRunner.createIndex(
      'token_transactions',
      new TableIndex({
        name: 'IDX_token_transactions_user_token',
        columnNames: ['receiver_id', 'token_type', 'status'],
      })
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'token_transactions',
      new TableForeignKey({
        name: 'FK_token_transactions_sender',
        columnNames: ['sender_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'token_transactions',
      new TableForeignKey({
        name: 'FK_token_transactions_receiver',
        columnNames: ['receiver_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('token_transactions', 'FK_token_transactions_sender');
    await queryRunner.dropForeignKey('token_transactions', 'FK_token_transactions_receiver');

    // Drop indexes
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_user_token');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_created_at');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_status');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_tx_hash');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_token_id');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_token_type');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_receiver');
    await queryRunner.dropIndex('token_transactions', 'IDX_token_transactions_sender');

    // Drop table
    await queryRunner.dropTable('token_transactions');

    // Drop enum types
    await queryRunner.query('DROP TYPE "transaction_status_enum"');
    await queryRunner.query('DROP TYPE "token_type_enum"');
  }
}
