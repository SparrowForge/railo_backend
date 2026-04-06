import { MigrationInterface, QueryRunner } from "typeorm";

export class PostNotification1775487490033 implements MigrationInterface {
    name = 'PostNotification1775487490033'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_notification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_51ecc933289d82022bb22c202f5" UNIQUE ("postId", "userId"), CONSTRAINT "PK_7ba7f31a3ca5dafe67b8806ba3f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_notification" ADD CONSTRAINT "FK_e3bf19956572471dc5fedef3db8" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_notification" ADD CONSTRAINT "FK_335e6f0b1ab89025fa84eadc4ca" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_notification" DROP CONSTRAINT "FK_335e6f0b1ab89025fa84eadc4ca"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_notification" DROP CONSTRAINT "FK_e3bf19956572471dc5fedef3db8"`);
        await queryRunner.query(`DROP TABLE "rillo_post_notification"`);
    }

}
