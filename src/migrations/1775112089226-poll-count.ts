import { MigrationInterface, QueryRunner } from "typeorm";

export class PollCount1775112089226 implements MigrationInterface {
    name = 'PollCount1775112089226'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD "pollCount" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP COLUMN "pollCount"`);
    }

}
