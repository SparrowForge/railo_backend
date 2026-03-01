import { MigrationInterface, QueryRunner } from "typeorm";

export class Story1772358191388 implements MigrationInterface {
    name = 'Story1772358191388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_story_visibility_enum" AS ENUM('Public', 'Followers', 'Only Me')`);
        await queryRunner.query(`CREATE TABLE "rillo_story" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "file_id" integer NOT NULL, "visibility" "public"."rillo_story_visibility_enum" NOT NULL DEFAULT 'Public', "expires_at" TIMESTAMP NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_56d7652ff0e8285e75a126c94e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_20421b07932288469f67bc475e" ON "rillo_story" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "rillo_story_view" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "story_id" uuid NOT NULL, "viewer_id" uuid NOT NULL, "viewed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_64d57366a26676f1992a1661f18" UNIQUE ("story_id", "viewer_id"), CONSTRAINT "PK_d4f1cd447e12eecda334b15f415" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bfadfaad415d17a770534cb1fb" ON "rillo_story_view" ("story_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e8ce692b12a551825561f21532" ON "rillo_story_view" ("viewer_id") `);
        await queryRunner.query(`ALTER TABLE "rillo_story" ADD CONSTRAINT "FK_20421b07932288469f67bc475e5" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_story" ADD CONSTRAINT "FK_1168d19507069f0442e87944481" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_story_view" ADD CONSTRAINT "FK_bfadfaad415d17a770534cb1fb4" FOREIGN KEY ("story_id") REFERENCES "rillo_story"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_story_view" DROP CONSTRAINT "FK_bfadfaad415d17a770534cb1fb4"`);
        await queryRunner.query(`ALTER TABLE "rillo_story" DROP CONSTRAINT "FK_1168d19507069f0442e87944481"`);
        await queryRunner.query(`ALTER TABLE "rillo_story" DROP CONSTRAINT "FK_20421b07932288469f67bc475e5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e8ce692b12a551825561f21532"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bfadfaad415d17a770534cb1fb"`);
        await queryRunner.query(`DROP TABLE "rillo_story_view"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20421b07932288469f67bc475e"`);
        await queryRunner.query(`DROP TABLE "rillo_story"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_story_visibility_enum"`);
    }

}
