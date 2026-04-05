import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentFileId1775396537312 implements MigrationInterface {
    name = 'CommentFileId1775396537312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comments" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_comments" ADD CONSTRAINT "FK_67d30b7a56e0875f225f80f3140" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comments" DROP CONSTRAINT "FK_67d30b7a56e0875f225f80f3140"`);
        await queryRunner.query(`ALTER TABLE "rillo_comments" DROP COLUMN "file_id"`);
    }

}
