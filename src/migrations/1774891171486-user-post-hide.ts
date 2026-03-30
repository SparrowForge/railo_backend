import { MigrationInterface, QueryRunner } from "typeorm";

export class UserPostHide1774891171486 implements MigrationInterface {
    name = 'UserPostHide1774891171486'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_user_post_hide" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loggedInUserId" uuid NOT NULL, "targetUserId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "UQ_faabf7275368d7e6c752f7e5742" UNIQUE ("loggedInUserId", "targetUserId"), CONSTRAINT "PK_a1e995564aec1dfeff102afbcb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_user_post_hide" ADD CONSTRAINT "FK_488143d970ef697e4300c3a2e85" FOREIGN KEY ("loggedInUserId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_user_post_hide" ADD CONSTRAINT "FK_7cadd87f71ceab4826fbae684e6" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_user_post_hide" DROP CONSTRAINT "FK_7cadd87f71ceab4826fbae684e6"`);
        await queryRunner.query(`ALTER TABLE "rillo_user_post_hide" DROP CONSTRAINT "FK_488143d970ef697e4300c3a2e85"`);
        await queryRunner.query(`DROP TABLE "rillo_user_post_hide"`);
    }

}
