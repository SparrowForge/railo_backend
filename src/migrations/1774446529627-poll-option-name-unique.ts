import { MigrationInterface, QueryRunner } from "typeorm";

export class PollOptionNameUnique1774446529627 implements MigrationInterface {
    name = 'PollOptionNameUnique1774446529627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" ADD CONSTRAINT "UQ_746c975d74bc37eb7e1f78dd26a" UNIQUE ("name")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" DROP CONSTRAINT "UQ_746c975d74bc37eb7e1f78dd26a"`);
    }

}
