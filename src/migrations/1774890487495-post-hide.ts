import { MigrationInterface, QueryRunner } from "typeorm";

export class PostHide1774890487495 implements MigrationInterface {
    name = 'PostHide1774890487495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_hide" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_22cd5e9c6c92f7308e333d1d63e" UNIQUE ("postId", "userId"), CONSTRAINT "PK_c68dc80400ee101600b0d438f1c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_hide" ADD CONSTRAINT "FK_1fb37b051bc09193d90797b4cfe" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_hide" ADD CONSTRAINT "FK_e162a1fdc83f6fedcff872be9f9" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_hide" DROP CONSTRAINT "FK_e162a1fdc83f6fedcff872be9f9"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_hide" DROP CONSTRAINT "FK_1fb37b051bc09193d90797b4cfe"`);
        await queryRunner.query(`DROP TABLE "rillo_post_hide"`);
    }

}
