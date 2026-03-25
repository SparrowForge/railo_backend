import { MigrationInterface, QueryRunner } from "typeorm";

export class PollPollOptions1774450703040 implements MigrationInterface {
    name = 'PollPollOptions1774450703040'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_poll_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "pollOptionId" uuid NOT NULL, CONSTRAINT "UQ_ab87abcbdf9bc608ef559ac3563" UNIQUE ("postId", "pollOptionId"), CONSTRAINT "PK_d434203ed91a9405015f6b6a48a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD CONSTRAINT "FK_e27a8587f8eb1aa10a5b32c5a19" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" ADD CONSTRAINT "FK_903d088af3ffd1c9b6555e073f5" FOREIGN KEY ("pollOptionId") REFERENCES "rillo_poll_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP CONSTRAINT "FK_903d088af3ffd1c9b6555e073f5"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_options" DROP CONSTRAINT "FK_e27a8587f8eb1aa10a5b32c5a19"`);
        await queryRunner.query(`DROP TABLE "rillo_post_poll_options"`);
    }

}
