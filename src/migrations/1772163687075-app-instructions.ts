import { MigrationInterface, QueryRunner } from "typeorm";

export class AppInstructions1772163687075 implements MigrationInterface {
    name = 'AppInstructions1772163687075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_chat_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "rillo_chat_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sender_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "status" "public"."rillo_chat_requests_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dfd5daf39283b0a35751612f4f5" UNIQUE ("sender_id", "receiver_id"), CONSTRAINT "PK_5325b69b8ec3ac7e22489d62a18" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_app_instructions_particulars_enum" AS ENUM('Distance levels in Rillo', 'Notes', 'Rillo modes:')`);
        await queryRunner.query(`CREATE TABLE "rillo_app_instructions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "particulars" "public"."rillo_app_instructions_particulars_enum" NOT NULL DEFAULT 'Notes', "instruction" character varying NOT NULL, "created_by_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fc6593d0c310ea1b1acdac96258" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ADD CONSTRAINT "FK_622aa56eaf50713641d3a410bba" FOREIGN KEY ("created_by_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" DROP CONSTRAINT "FK_622aa56eaf50713641d3a410bba"`);
        await queryRunner.query(`DROP TABLE "rillo_app_instructions"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_app_instructions_particulars_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_chat_requests"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_chat_requests_status_enum"`);
    }

}
