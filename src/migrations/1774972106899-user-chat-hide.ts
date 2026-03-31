import { MigrationInterface, QueryRunner } from "typeorm";

export class UserChatHide1774972106899 implements MigrationInterface {
    name = 'UserChatHide1774972106899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_user_chat_hide" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loggedInUserId" uuid NOT NULL, "targetUserId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "UQ_ba7ebed90d486bad326de9c4198" UNIQUE ("loggedInUserId", "targetUserId"), CONSTRAINT "PK_ba73e415c078f2d4b35750e63b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_user_chat_hide" ADD CONSTRAINT "FK_c96dafa177d9e4a39deb5106662" FOREIGN KEY ("loggedInUserId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_user_chat_hide" ADD CONSTRAINT "FK_5dc6e340eefa88b3f4d3ff748a8" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_user_chat_hide" DROP CONSTRAINT "FK_5dc6e340eefa88b3f4d3ff748a8"`);
        await queryRunner.query(`ALTER TABLE "rillo_user_chat_hide" DROP CONSTRAINT "FK_c96dafa177d9e4a39deb5106662"`);
        await queryRunner.query(`DROP TABLE "rillo_user_chat_hide"`);
    }

}
