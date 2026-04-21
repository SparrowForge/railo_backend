import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSubscribedEndAt1776791324662 implements MigrationInterface {
    name = 'UpdateSubscribedEndAt1776791324662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "subscription_end_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "subscription_end_at"`);
    }

}
