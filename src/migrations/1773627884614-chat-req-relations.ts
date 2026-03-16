import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatReqRelations1773627884614 implements MigrationInterface {
    name = 'ChatReqRelations1773627884614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" ADD CONSTRAINT "FK_0ac655f6366f5dbe31d0e46f90f" FOREIGN KEY ("sender_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" ADD CONSTRAINT "FK_b0912c224645f497b2e542b5edf" FOREIGN KEY ("receiver_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" DROP CONSTRAINT "FK_b0912c224645f497b2e542b5edf"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_requests" DROP CONSTRAINT "FK_0ac655f6366f5dbe31d0e46f90f"`);
    }

}
