import { MigrationInterface, QueryRunner } from "typeorm";

export class PostCommentsReport1778642763030 implements MigrationInterface {
    name = 'PostCommentsReport1778642763030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD "postCommentsId" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "FK_2e70788eab53d749b10ff628dad" FOREIGN KEY ("postCommentsId") REFERENCES "rillo_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "FK_2e70788eab53d749b10ff628dad"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP COLUMN "postCommentsId"`);
    }

}
