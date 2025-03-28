import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Wallet } from './wallet.entity';

@Entity()
export class WalletActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.activities, { onDelete: 'CASCADE' })
  wallet: Wallet;

  @Column()
  type: 'deposit' | 'withdrawal' | 'transaction';

  @Column({ type: 'decimal', precision: 18, scale: 6 })
  amount: number;

  @Column({ nullable: true })
  transactionHash: string;

  @CreateDateColumn()
  timestamp: Date;
}
