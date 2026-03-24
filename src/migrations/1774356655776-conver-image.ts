import { MigrationInterface, QueryRunner } from "typeorm";

export class ConverImage1774356655776 implements MigrationInterface {
    name = 'ConverImage1774356655776'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_26fb2c78985f70335ba7ff57c94"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" RENAME COLUMN "file_id" TO "image_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_83798f58fb390fe015d1d5e97d5" FOREIGN KEY ("image_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_83798f58fb390fe015d1d5e97d5"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" RENAME COLUMN "image_id" TO "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_26fb2c78985f70335ba7ff57c94" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
