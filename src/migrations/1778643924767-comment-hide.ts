import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentHide1778643924767 implements MigrationInterface {
    name = 'CommentHide1778643924767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_comment_hide" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_73fc5e4d55af2a383dc51a22041" UNIQUE ("commentId", "userId"), CONSTRAINT "PK_6319a68fc85df0989c380707681" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_7b958ebf9b7f5b142b8ab8cff44" FOREIGN KEY ("commentId") REFERENCES "rillo_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_ac2feb9534f99720a1e1d3a0a16" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_ac2feb9534f99720a1e1d3a0a16"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_7b958ebf9b7f5b142b8ab8cff44"`);
        await queryRunner.query(`DROP TABLE "rillo_comment_hide"`);
    }
}
