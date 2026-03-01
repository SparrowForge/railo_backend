import { MigrationInterface, QueryRunner } from "typeorm";

export class StoryCount1772360292352 implements MigrationInterface {
    name = 'StoryCount1772360292352'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_story_like" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "story_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dbde32e91d8ccc66e5658bf115c" UNIQUE ("story_id", "user_id"), CONSTRAINT "PK_d52997be260f91913a08b10bcf3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9d70c94c8de4fcc75c76627dc7" ON "rillo_story_like" ("story_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_05776324cabb03bab023d7167b" ON "rillo_story_like" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "rillo_story" ADD "view_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_story" ADD "like_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_story_like" ADD CONSTRAINT "FK_9d70c94c8de4fcc75c76627dc73" FOREIGN KEY ("story_id") REFERENCES "rillo_story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_story_like" DROP CONSTRAINT "FK_9d70c94c8de4fcc75c76627dc73"`);
        await queryRunner.query(`ALTER TABLE "rillo_story" DROP COLUMN "like_count"`);
        await queryRunner.query(`ALTER TABLE "rillo_story" DROP COLUMN "view_count"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05776324cabb03bab023d7167b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d70c94c8de4fcc75c76627dc7"`);
        await queryRunner.query(`DROP TABLE "rillo_story_like"`);
    }

}
