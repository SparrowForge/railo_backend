import { MigrationInterface, QueryRunner } from "typeorm";

export class UserLocation1772939197532 implements MigrationInterface {
    name = 'UserLocation1772939197532'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_users_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "location" geography(Point,4326) NOT NULL, "latitude" integer, "longitude" integer, "area" character varying, "city" character varying, "state" character varying, "country" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b1b231c06197816d7086cc43b6e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_userlocation_user_id" ON "rillo_users_location" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_userlocation_location" ON "rillo_users_location" USING GiST ("location") `);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ADD CONSTRAINT "FK_21c838546367a3b13f732f1835a" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users_location" DROP CONSTRAINT "FK_21c838546367a3b13f732f1835a"`);
        await queryRunner.query(`DROP INDEX "public"."idx_userlocation_location"`);
        await queryRunner.query(`DROP INDEX "public"."idx_userlocation_user_id"`);
        await queryRunner.query(`DROP TABLE "rillo_users_location"`);
    }

}
