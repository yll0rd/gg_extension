import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WalletActivity } from './wallet-activity.entity';
import { OneToMany } from 'typeorm';

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Index({ unique: true })
  user: User;

  @Column({ unique: true })
  @Index({ unique: true })
  address: string; // Starknet wallet address

  @Column({ default: 0 })
  balance: number; // Wallet balance (tracked for caching)

  @Column({ default: false })
  isVerified: boolean; // Signature verification status

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => WalletActivity, (activity) => activity.wallet)
  activities: WalletActivity[];
}
