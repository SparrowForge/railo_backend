import { MigrationInterface, QueryRunner } from "typeorm";

export class StickerUpload1776534421387 implements MigrationInterface {
    name = 'StickerUpload1776534421387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_stickers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "uploaded_by_user_id" uuid NOT NULL, "file_id" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e287b8d8d8a93436700e214966e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dcd44ecf97e2a60a58c0442379" ON "rillo_stickers" ("uploaded_by_user_id") `);
        await queryRunner.query(`ALTER TABLE "rillo_stickers" ADD CONSTRAINT "FK_dcd44ecf97e2a60a58c04423797" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_stickers" ADD CONSTRAINT "FK_d4bf0028de3e8fd2ad4cb15a4bb" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_stickers" DROP CONSTRAINT "FK_d4bf0028de3e8fd2ad4cb15a4bb"`);
        await queryRunner.query(`ALTER TABLE "rillo_stickers" DROP CONSTRAINT "FK_dcd44ecf97e2a60a58c04423797"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dcd44ecf97e2a60a58c0442379"`);
        await queryRunner.query(`DROP TABLE "rillo_stickers"`);
    }

}
