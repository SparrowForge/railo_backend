import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rillo_audit_logs')
@Index(['userId', 'timestamp'])
@Index(['resource', 'resourceId'])
@Index(['action', 'timestamp'])
@Index(['success', 'timestamp'])
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true, length: 255 })
  username?: string;

  @Column({ length: 50 })
  action: string; // CREATE, READ, UPDATE, DELETE

  @Column({ length: 100 })
  resource: string; // users, panels, branches, etc.

  @Column({ nullable: true, length: 100 })
  resourceId?: string;

  @Column({ length: 10 })
  method: string; // GET, POST, PUT, DELETE

  @Column({ length: 500 })
  url: string;

  @Column({ length: 45 })
  ip: string;

  @Column({ length: 500 })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  requestBody?: any;

  @Column()
  responseStatus: number;

  @Column()
  responseTime: number; // in milliseconds

  @Column()
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
