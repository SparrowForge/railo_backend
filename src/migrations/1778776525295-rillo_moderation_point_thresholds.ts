import { MigrationInterface, QueryRunner } from "typeorm";

export class RilloModerationPointThresholds1778776525295 implements MigrationInterface {
    name = 'RilloModerationPointThresholds1778776525295'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_7b958ebf9b7f5b142b8ab8cff44"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_ac2feb9534f99720a1e1d3a0a16"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "UQ_73fc5e4d55af2a383dc51a22041"`);
        await queryRunner.query(`CREATE TABLE "rillo_moderation_point_thresholds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "points" integer NOT NULL, "createdById" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_d6a2a0fdd6e3f1adc7fb11e2c45" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "UQ_a5df798a56d4065de004d09af38" UNIQUE ("commentId", "userId")`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_point_thresholds" ADD CONSTRAINT "FK_af55988c64e3e5f36fa33046117" FOREIGN KEY ("createdById") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_9a7d0848e9a191580f38ca163de" FOREIGN KEY ("commentId") REFERENCES "rillo_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_8795e71a5678e648c9de0154a57" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_8795e71a5678e648c9de0154a57"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "FK_9a7d0848e9a191580f38ca163de"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_point_thresholds" DROP CONSTRAINT "FK_af55988c64e3e5f36fa33046117"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" DROP CONSTRAINT "UQ_a5df798a56d4065de004d09af38"`);
        await queryRunner.query(`DROP TABLE "rillo_moderation_point_thresholds"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "UQ_73fc5e4d55af2a383dc51a22041" UNIQUE ("commentId", "userId")`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_ac2feb9534f99720a1e1d3a0a16" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_hide" ADD CONSTRAINT "FK_7b958ebf9b7f5b142b8ab8cff44" FOREIGN KEY ("commentId") REFERENCES "rillo_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
