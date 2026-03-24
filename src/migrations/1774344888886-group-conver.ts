import { MigrationInterface, QueryRunner } from "typeorm";

export class GroupConver1774344888886 implements MigrationInterface {
    name = 'GroupConver1774344888886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_conversation_participant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "is_admin" boolean NOT NULL DEFAULT false, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_455a4b491423cc55afdc193dfbc" UNIQUE ("conversation_id", "user_id"), CONSTRAINT "PK_e32027f994171f25f0c8f3d8fc6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_conversation_type_enum" AS ENUM('direct', 'group')`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "type" "public"."rillo_conversation_type_enum" NOT NULL DEFAULT 'direct'`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "title" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_52087f8a374998083a96a2ef072"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ALTER COLUMN "user_one_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ALTER COLUMN "user_two_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation_participant" ADD CONSTRAINT "FK_bb4b9ed2aba3da1e2ba214d1be5" FOREIGN KEY ("conversation_id") REFERENCES "rillo_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation_participant" ADD CONSTRAINT "FK_6bbd6a3d807277973551e1cc9c7" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_4c8cddb22a17b7c9d34ad39d38d" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84" FOREIGN KEY ("user_one_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_52087f8a374998083a96a2ef072" FOREIGN KEY ("user_two_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_52087f8a374998083a96a2ef072"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP CONSTRAINT "FK_4c8cddb22a17b7c9d34ad39d38d"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation_participant" DROP CONSTRAINT "FK_6bbd6a3d807277973551e1cc9c7"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation_participant" DROP CONSTRAINT "FK_bb4b9ed2aba3da1e2ba214d1be5"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ALTER COLUMN "user_two_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ALTER COLUMN "user_one_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_52087f8a374998083a96a2ef072" FOREIGN KEY ("user_two_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD CONSTRAINT "FK_d14f2a8bf683d41e6688a518b84" FOREIGN KEY ("user_one_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_conversation_type_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation_participant"`);
    }

}
