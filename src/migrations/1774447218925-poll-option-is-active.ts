import { MigrationInterface, QueryRunner } from "typeorm";

export class PollOptionIsActive1774447218925 implements MigrationInterface {
    name = 'PollOptionIsActive1774447218925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" ADD "is_active" boolean DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" DROP COLUMN "is_active"`);
    }

}
