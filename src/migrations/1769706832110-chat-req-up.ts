import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatReqUp1769706832110 implements MigrationInterface {
    name = 'ChatReqUp1769706832110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."chat_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "chat_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sender_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "status" "public"."chat_requests_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7699f10476cca23879e9b27a9aa" UNIQUE ("sender_id", "receiver_id"), CONSTRAINT "PK_0d60b3c3b6f1a9b71e99f0d8f8e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "chat_requests"`);
        await queryRunner.query(`DROP TYPE "public"."chat_requests_status_enum"`);
    }

}
