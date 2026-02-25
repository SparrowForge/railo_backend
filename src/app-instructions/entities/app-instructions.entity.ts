import { ApiProperty } from "@nestjs/swagger";
import { AppInstructionsEnum } from "src/common/enums/app-instructions.enum";
import { User } from "src/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";

@Entity('rillo_app_instructions')
export class ChatRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: AppInstructionsEnum, default: AppInstructionsEnum.Notes, })
    particulars: AppInstructionsEnum;

    @Column({ nullable: false })
    instruction: string;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    /* Relation */
    @ApiProperty({ description: 'File object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    created_by_user: User;
}

