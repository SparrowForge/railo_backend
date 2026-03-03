import { ApiProperty } from "@nestjs/swagger";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { AppInstructionsEnum } from "./app-instructions.enum";
import { User } from "src/users/entities/user.entity";

@Entity('rillo_app_instructions')
export class AppInstructions {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: AppInstructionsEnum, default: AppInstructionsEnum.Notes, })
    particulars: AppInstructionsEnum;

    @Column({ nullable: false })
    instruction: string;

    @Column({ nullable: true, default: 0 })
    sorting_no: number;

    @Column({ type: 'uuid' })
    created_by_id: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    /* Relation */
    @ApiProperty({ description: 'File object', type: () => User, })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'created_by_id' })
    created_by_user: User;
}

