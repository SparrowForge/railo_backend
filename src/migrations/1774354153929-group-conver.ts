import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupConver1774354153929 implements MigrationInterface {
    name = 'GroupConver1774354153929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP CONSTRAINT "FK_9aad978b1b3935746a59eaa6e45"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" RENAME COLUMN "image_url" TO "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" RENAME COLUMN "file_id" TO "file_ids"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP COLUMN "file_ids"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD "file_ids" integer array`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_26fb2c78985f70335ba7ff57c94" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_26fb2c78985f70335ba7ff57c94"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP COLUMN "file_ids"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD "file_ids" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "file_id" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_message" RENAME COLUMN "file_ids" TO "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" RENAME COLUMN "file_id" TO "image_url"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD CONSTRAINT "FK_9aad978b1b3935746a59eaa6e45" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
