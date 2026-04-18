import { User } from "../../users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from "typeorm";

@Entity('rillo_moderation_threshold')
export class ModerationThreshold {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: false })
    threshold_point: number;

    @Column({ type: 'uuid', nullable: false })
    created_by_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    /*Relations */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    created_by_user: User;
}

