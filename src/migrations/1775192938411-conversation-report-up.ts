import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationReportUp1775192938411 implements MigrationInterface {
    name = 'ConversationReportUp1775192938411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "FK_91e2cb4fac514c8d6371af25cfb"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "UQ_7ae4e011494229829a6feaf4f11"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP COLUMN "targetUserId"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD "conversationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "UQ_eeed1bf8e0ce6481fe3fdd9020d" UNIQUE ("loggedInUserId", "conversationId")`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "FK_709e3106bde2763bd6be55f2413" FOREIGN KEY ("conversationId") REFERENCES "rillo_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "FK_709e3106bde2763bd6be55f2413"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "UQ_eeed1bf8e0ce6481fe3fdd9020d"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP COLUMN "conversationId"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD "userId" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD "targetUserId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "UQ_7ae4e011494229829a6feaf4f11" UNIQUE ("loggedInUserId", "targetUserId")`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "FK_91e2cb4fac514c8d6371af25cfb" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
