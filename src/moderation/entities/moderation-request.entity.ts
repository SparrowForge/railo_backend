import { User } from "../../users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn, Unique } from "typeorm";

@Entity('rillo_moderation_threshold')
@Unique(['requested_by_id', 'approved_by_id'])
export class ModerationRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', nullable: false })
    requested_by_id: string;

    @Column({ type: 'uuid', nullable: true })
    approved_by_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    /*Relations */
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'requested_by_id' })
    requested_by_user: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approved_by_id' })
    approved_by_user: User;
}