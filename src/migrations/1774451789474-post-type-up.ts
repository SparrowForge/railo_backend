import { MigrationInterface, QueryRunner } from "typeorm";

export class PostTypeUp1774451789474 implements MigrationInterface {
    name = 'PostTypeUp1774451789474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."rillo_posts_posttype_enum" RENAME TO "rillo_posts_posttype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_posttype_enum" AS ENUM('audio', 'location', 'poll', 'link', 'regular', 'camera', 'photo')`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" TYPE "public"."rillo_posts_posttype_enum" USING "postType"::"text"::"public"."rillo_posts_posttype_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" SET DEFAULT 'regular'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_posttype_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_posttype_enum_old" AS ENUM('audio', 'location', 'time_line', 'link', 'regular', 'camera', 'photo')`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" TYPE "public"."rillo_posts_posttype_enum_old" USING "postType"::"text"::"public"."rillo_posts_posttype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ALTER COLUMN "postType" SET DEFAULT 'regular'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_posttype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_posts_posttype_enum_old" RENAME TO "rillo_posts_posttype_enum"`);
    }

}
