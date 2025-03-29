import { type MigrationInterface, type QueryRunner, Table, TableIndex } from "typeorm"

export class CreateLogEntriesTable1743102698090 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "log_entries",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "uuid_generate_v4()",
          },
          {
            name: "level",
            type: "varchar",
            length: "10",
          },
          {
            name: "message",
            type: "text",
          },
          {
            name: "context",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "metadata",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "timestamp",
            type: "timestamp with time zone",
            default: "now()",
          },
        ],
      }),
      true,
    )

    // Create indexes for better query performance
    await queryRunner.createIndex(
      "log_entries",
      new TableIndex({
        name: "idx_log_entries_level",
        columnNames: ["level"],
      }),
    )

    await queryRunner.createIndex(
      "log_entries",
      new TableIndex({
        name: "idx_log_entries_context",
        columnNames: ["context"],
      }),
    )

    await queryRunner.createIndex(
      "log_entries",
      new TableIndex({
        name: "idx_log_entries_timestamp",
        columnNames: ["timestamp"],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("log_entries", "idx_log_entries_timestamp")
    await queryRunner.dropIndex("log_entries", "idx_log_entries_context")
    await queryRunner.dropIndex("log_entries", "idx_log_entries_level")
    await queryRunner.dropTable("log_entries")
  }
}

