// src/migrations/1716032714000-CreateNotificationsTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable1716032714000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'new_message',
        'mention',
        'token_received'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" varchar NOT NULL,
        "type" notification_type_enum NOT NULL DEFAULT 'new_message',
        "content" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Individual indexes
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_type" ON "notifications" ("type");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_is_read" ON "notifications" ("is_read");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notifications_created_at" ON "notifications" ("created_at");
    `);

    // Composite index for common query pattern
    await queryRunner.query(`
      CREATE INDEX "idx_notifications_user_id_is_read" ON "notifications" ("user_id", "is_read");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_notifications_user_id_is_read"`);
    await queryRunner.query(`DROP INDEX "idx_notifications_created_at"`);
    await queryRunner.query(`DROP INDEX "idx_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX "idx_notifications_type"`);
    await queryRunner.query(`DROP INDEX "idx_notifications_user_id"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "notification_type_enum"`);
  }
}
