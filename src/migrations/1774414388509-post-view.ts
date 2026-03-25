import { MigrationInterface, QueryRunner } from "typeorm";

export class PostView1774414388509 implements MigrationInterface {
    name = 'PostView1774414388509'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_views" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4f9e851069a648280c5087c83ca" UNIQUE ("postId", "userId"), CONSTRAINT "PK_cbb3d4e514aea8632bdcae8946b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_views" ADD CONSTRAINT "FK_e5abb891cb584f7e44186fabd30" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_views" DROP CONSTRAINT "FK_e5abb891cb584f7e44186fabd30"`);
        await queryRunner.query(`DROP TABLE "rillo_post_views"`);
    }

}
