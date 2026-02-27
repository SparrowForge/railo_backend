import { MigrationInterface, QueryRunner } from "typeorm";

export class AppInstructionsUp1772165131901 implements MigrationInterface {
    name = 'AppInstructionsUp1772165131901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" DROP COLUMN "deleted_at"`);
    }

}
