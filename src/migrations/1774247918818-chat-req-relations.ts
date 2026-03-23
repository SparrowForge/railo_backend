import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatReqRelations1774247918818 implements MigrationInterface {
    name = 'ChatReqRelations1774247918818'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_delete_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "is_irrelevant_content" boolean NOT NULL DEFAULT false, "is_negative_community" boolean NOT NULL DEFAULT false, "is_no_activity" boolean NOT NULL DEFAULT false, "is_too_time_consuming" boolean NOT NULL DEFAULT false, "is_other" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_af7242dbe942951b62bec397805" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_delete_account" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "rillo_delete_account" ADD CONSTRAINT "FK_ef0a499f30e45d2dbfb3087779d" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_delete_account" DROP CONSTRAINT "FK_ef0a499f30e45d2dbfb3087779d"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_delete_account"`);
        await queryRunner.query(`DROP TABLE "rillo_delete_account"`);
    }

}
