import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from "src/users/entities/user.entity";
import { Files } from "src/files/entities/file.entity";

@Entity({ name: 'rillo_stickers' })
export class StickerUpload {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ type: 'uuid' })
    uploaded_by_user_id: string;

    @Column({ type: 'number' })
    file_id: number;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    /* Relations */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'uploaded_by_user_id' })
    uploaded_by_user: User;

    @ManyToOne(() => Files, { nullable: true })
    @JoinColumn({ name: 'file_id' })
    file: Files;
}
