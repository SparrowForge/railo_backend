import { MigrationInterface, QueryRunner } from "typeorm";

export class ModerationRequest1776522148469 implements MigrationInterface {
    name = 'ModerationRequest1776522148469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "rillo_moderation_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requestedById" uuid NOT NULL, "status" "public"."rillo_moderation_requests_status_enum" NOT NULL DEFAULT 'pending', "message" text, "reviewNote" text, "reviewedById" uuid, "reviewedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_1bd95f3dbfa42626b7db46ad36a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_requests" ADD CONSTRAINT "FK_d5ae3cafb78a7794dd66e4e3a84" FOREIGN KEY ("requestedById") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_requests" ADD CONSTRAINT "FK_9e4c89fccd5f9de15de790da9f0" FOREIGN KEY ("reviewedById") REFERENCES "rillo_users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_requests" DROP CONSTRAINT "FK_9e4c89fccd5f9de15de790da9f0"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_requests" DROP CONSTRAINT "FK_d5ae3cafb78a7794dd66e4e3a84"`);
        await queryRunner.query(`DROP TABLE "rillo_moderation_requests"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_requests_status_enum"`);
    }

}
