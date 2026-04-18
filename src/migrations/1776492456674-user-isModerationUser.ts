import { MigrationInterface, QueryRunner } from "typeorm";

export class UserIsModerationUser1776492456674 implements MigrationInterface {
    name = 'UserIsModerationUser1776492456674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_moderation_user" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_moderation_user"`);
    }

}
