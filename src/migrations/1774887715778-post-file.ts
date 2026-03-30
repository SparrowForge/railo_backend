import { MigrationInterface, QueryRunner } from "typeorm";

export class PostFile1774887715778 implements MigrationInterface {
    name = 'PostFile1774887715778'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP CONSTRAINT "FK_22c98cbac0bd649097d9ecd487b"`);
        await queryRunner.query(`CREATE TABLE "rillo_post_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "fileId" integer NOT NULL, CONSTRAINT "UQ_1b5be67308979ec3113e9a0c255" UNIQUE ("postId", "fileId"), CONSTRAINT "PK_f35a2afa10c76a79cb4e8dabfce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_files" ADD CONSTRAINT "FK_d384ca1340889816b5d3053ccc1" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_files" ADD CONSTRAINT "FK_ff04b03b0a84f555edc049f40e1" FOREIGN KEY ("fileId") REFERENCES "rillo_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_files" DROP CONSTRAINT "FK_ff04b03b0a84f555edc049f40e1"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_files" DROP CONSTRAINT "FK_d384ca1340889816b5d3053ccc1"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "fileId" integer`);
        await queryRunner.query(`DROP TABLE "rillo_post_files"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD CONSTRAINT "FK_22c98cbac0bd649097d9ecd487b" FOREIGN KEY ("fileId") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
