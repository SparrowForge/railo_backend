import { MigrationInterface, QueryRunner } from "typeorm";

export class AppInstOrderBy1772555254943 implements MigrationInterface {
    name = 'AppInstOrderBy1772555254943'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ADD "sorting_no" integer DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" DROP COLUMN "sorting_no"`);
    }

}
