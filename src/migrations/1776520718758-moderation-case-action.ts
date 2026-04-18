import { MigrationInterface, QueryRunner } from "typeorm";

export class ModerationCaseAction1776520718758 implements MigrationInterface {
    name = 'ModerationCaseAction1776520718758'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_actions_actiontype_enum" AS ENUM('claim', 'dismiss', 'escalate', 'hide_post', 'restore_post', 'lock_conversation', 'unlock_conversation')`);
        await queryRunner.query(`CREATE TABLE "rillo_moderation_actions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "caseId" uuid NOT NULL, "moderatorUserId" uuid NOT NULL, "actionType" "public"."rillo_moderation_actions_actiontype_enum" NOT NULL, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d47c203bd139469f20447c598ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_cases_targettype_enum" AS ENUM('post', 'conversation')`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_cases_status_enum" AS ENUM('open', 'in_review', 'resolved', 'dismissed', 'escalated')`);
        await queryRunner.query(`CREATE TABLE "rillo_moderation_cases" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "targetType" "public"."rillo_moderation_cases_targettype_enum" NOT NULL, "targetId" uuid NOT NULL, "status" "public"."rillo_moderation_cases_status_enum" NOT NULL DEFAULT 'open', "reportCount" integer NOT NULL DEFAULT '0', "lastReportedAt" TIMESTAMP, "reviewedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_82423ccbdd30735520726aa6a14" UNIQUE ("targetType", "targetId"), CONSTRAINT "PK_bcc50f8690665bb98f422c4611d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2dd0d2c6853acc5fc2e14b1720" ON "rillo_moderation_cases" ("status", "lastReportedAt") `);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "is_moderation_locked" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "moderation_locked_by" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "moderation_locked_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "moderation_lock_reason" text`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_actions" ADD CONSTRAINT "FK_459ec0feec4c8c7a58ec970e256" FOREIGN KEY ("caseId") REFERENCES "rillo_moderation_cases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_actions" ADD CONSTRAINT "FK_f03e956eb1696d0325ea59f0fbf" FOREIGN KEY ("moderatorUserId") REFERENCES "rillo_users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_actions" DROP CONSTRAINT "FK_f03e956eb1696d0325ea59f0fbf"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_actions" DROP CONSTRAINT "FK_459ec0feec4c8c7a58ec970e256"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "moderation_lock_reason"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "moderation_locked_at"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "moderation_locked_by"`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "is_moderation_locked"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2dd0d2c6853acc5fc2e14b1720"`);
        await queryRunner.query(`DROP TABLE "rillo_moderation_cases"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_cases_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_cases_targettype_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_moderation_actions"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_actions_actiontype_enum"`);
    }

}
