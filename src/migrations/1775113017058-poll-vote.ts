import { MigrationInterface, QueryRunner } from "typeorm";

export class PollVote1775113017058 implements MigrationInterface {
    name = 'PollVote1775113017058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_poll_votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "postPollOptionId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_69da181798de9e06fa3e0d61b87" UNIQUE ("postId", "userId"), CONSTRAINT "PK_fe609a2f91b0cde81548bace7e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" ADD CONSTRAINT "FK_ee57a2c0afd6ed974b6436d0878" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" ADD CONSTRAINT "FK_33c1efd53fee36e9afdfa140fd8" FOREIGN KEY ("postPollOptionId") REFERENCES "rillo_post_poll_options"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" ADD CONSTRAINT "FK_720563730cc6e754ea768a4aa40" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" DROP CONSTRAINT "FK_720563730cc6e754ea768a4aa40"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" DROP CONSTRAINT "FK_33c1efd53fee36e9afdfa140fd8"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_poll_votes" DROP CONSTRAINT "FK_ee57a2c0afd6ed974b6436d0878"`);
        await queryRunner.query(`DROP TABLE "rillo_post_poll_votes"`);
    }

}
