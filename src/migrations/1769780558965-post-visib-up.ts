import { MigrationInterface, QueryRunner } from "typeorm";

export class PostVisibUp1769780558965 implements MigrationInterface {
    name = 'PostVisibUp1769780558965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."rillo_posts_visibility_enum" RENAME TO "rillo_posts_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_visibility_enum" AS ENUM('ghost', 'normal', 'private')`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" TYPE "public"."rillo_posts_visibility_enum" USING "visibility"::"text"::"public"."rillo_posts_visibility_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" SET DEFAULT 'normal'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84" FOREIGN KEY ("user_one_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_52087f8a374998083a96a2ef072" FOREIGN KEY ("user_two_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_52087f8a374998083a96a2ef072"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_visibility_enum_old" AS ENUM('ghost', 'normal')`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" TYPE "public"."rillo_posts_visibility_enum_old" USING "visibility"::"text"::"public"."rillo_posts_visibility_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "visibility" SET DEFAULT 'normal'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_posts_visibility_enum_old" RENAME TO "rillo_posts_visibility_enum"`);
    }

}
