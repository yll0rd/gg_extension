import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from "typeorm"

@Entity("log_entries")
export class LogEntry {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  @Index()
  level: string

  @Column("text")
  message: string

  @Column({ nullable: true })
  @Index()
  context: string

  @Column("jsonb", { nullable: true })
  metadata: Record<string, any>

  @CreateDateColumn()
  @Index()
  timestamp: Date
}

