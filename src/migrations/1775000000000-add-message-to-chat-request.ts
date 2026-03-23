import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessageToChatRequest1775000000000 implements MigrationInterface {
    name = 'AddMessageToChatRequest1775000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" ADD "conversation_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" DROP COLUMN "conversation_id"`);
    }
}
