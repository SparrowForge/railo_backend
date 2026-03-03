import { MigrationInterface, QueryRunner } from "typeorm";

export class FileUp1772528637894 implements MigrationInterface {
    name = 'FileUp1772528637894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_files" ADD "public_url" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_files" DROP COLUMN "public_url"`);
    }

}
