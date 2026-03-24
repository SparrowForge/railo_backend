import { MigrationInterface, QueryRunner } from "typeorm";

export class MsgFile1774331701820 implements MigrationInterface {
    name = 'MsgFile1774331701820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD CONSTRAINT "FK_9aad978b1b3935746a59eaa6e45" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP CONSTRAINT "FK_9aad978b1b3935746a59eaa6e45"`);
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP COLUMN "file_id"`);
    }

}
