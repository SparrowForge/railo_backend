import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationPin1775192296456 implements MigrationInterface {
    name = 'ConversationPin1775192296456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_conversation_pins" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_36294e2e7baa000df48cff01e82" UNIQUE ("conversation_id", "user_id"), CONSTRAINT "PK_d0f8f130d9be2dfafba3026d00a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_conversation_pins" ADD CONSTRAINT "FK_4fbbf6fcd9f95186b53108ee408" FOREIGN KEY ("conversation_id") REFERENCES "rillo_conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_conversation_pins" DROP CONSTRAINT "FK_4fbbf6fcd9f95186b53108ee408"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation_pins"`);
    }

}
