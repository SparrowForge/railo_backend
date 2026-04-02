import { MigrationInterface, QueryRunner } from "typeorm";

export class PostPollUp1775134615567 implements MigrationInterface {
    name = 'PostPollUp1775134615567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP CONSTRAINT "FK_903d088af3ffd1c9b6555e073f5"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP CONSTRAINT "UQ_ab87abcbdf9bc608ef559ac3563"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" RENAME COLUMN "pollOptionId" TO "pollOption"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP COLUMN "pollOption"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD "pollOption" text`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD CONSTRAINT "UQ_1fe7381bb9508da5e6228c64510" UNIQUE ("postId", "pollOption")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP CONSTRAINT "UQ_1fe7381bb9508da5e6228c64510"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP COLUMN "pollOption"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD "pollOption" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" RENAME COLUMN "pollOption" TO "pollOptionId"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD CONSTRAINT "UQ_ab87abcbdf9bc608ef559ac3563" UNIQUE ("postId", "pollOptionId")`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD CONSTRAINT "FK_903d088af3ffd1c9b6555e073f5" FOREIGN KEY ("pollOptionId") REFERENCES "rillo_poll_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
