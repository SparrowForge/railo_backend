import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationIsChatRequestAccepted1776487678424 implements MigrationInterface {
    name = 'ConversationIsChatRequestAccepted1776487678424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" ADD "is_chat_request_accepted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation" DROP COLUMN "is_chat_request_accepted"`);
    }

}
