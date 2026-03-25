import { MigrationInterface, QueryRunner } from "typeorm";

export class PostPin1774426766128 implements MigrationInterface {
    name = 'PostPin1774426766128'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_post_pins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d55f55003828bc25181a1679a7b" UNIQUE ("postId", "userId"), CONSTRAINT "PK_d3891aa916f949682b895c8d993" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_pins" ADD CONSTRAINT "FK_31a0f5221f46e91a06ab1308657" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_pins" DROP CONSTRAINT "FK_31a0f5221f46e91a06ab1308657"`);
        await queryRunner.query(`DROP TABLE "rillo_post_pins"`);
    }

}
