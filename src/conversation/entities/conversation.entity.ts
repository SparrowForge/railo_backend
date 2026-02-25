import { ApiProperty } from "@nestjs/swagger";
import { User } from "src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity('rillo_conversation')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    user_one_id: string;

    @Column({ type: 'uuid' })
    user_two_id: string;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    /* Relation */
    @ApiProperty({ description: 'User object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_one_id' })
    user_one: User;


    @ApiProperty({ description: 'User object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_two_id' })
    user_two: User;
}
