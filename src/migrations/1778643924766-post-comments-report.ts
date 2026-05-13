import { MigrationInterface, QueryRunner } from "typeorm";

export class PostCommentsReport1778643924766 implements MigrationInterface {
    name = 'PostCommentsReport1778643924766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_comment_report_criteria_criteria_enum" AS ENUM('TERRORISM', 'HARASSMENT', 'HATE_SPEECH', 'SPAM', 'IMPERSONATION', 'VIOLENCE')`);
        await queryRunner.query(`CREATE TABLE "rillo_comment_report_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportId" uuid NOT NULL, "criteria" "public"."rillo_comment_report_criteria_criteria_enum" NOT NULL, CONSTRAINT "UQ_ea209e074d6e31e8586f170197a" UNIQUE ("reportId", "criteria"), CONSTRAINT "PK_1ae9805cb87068550455801ba5a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_comment_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d80e245940452726b51cf7e5036" UNIQUE ("commentId", "userId"), CONSTRAINT "PK_1629edaeb70a33f9b7dd1027b21" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_moderation_cases_targettype_enum" RENAME TO "rillo_moderation_cases_targettype_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_cases_targettype_enum" AS ENUM('post', 'conversation', 'comment')`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ALTER COLUMN "targetType" TYPE "public"."rillo_moderation_cases_targettype_enum" USING "targetType"::"text"::"public"."rillo_moderation_cases_targettype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_cases_targettype_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049" UNIQUE ("targetType", "postId", "conversationId")`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_report_criteria" ADD CONSTRAINT "FK_696978735b0f7d24aa53a6693bc" FOREIGN KEY ("reportId") REFERENCES "rillo_comment_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_reports" ADD CONSTRAINT "FK_06a303e4c7552cb639bb00e359c" FOREIGN KEY ("commentId") REFERENCES "rillo_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_reports" ADD CONSTRAINT "FK_aafe394f1c486dd54aeee50ff30" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "rillo_moderation_cases" WHERE "targetType" = 'comment'`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_reports" DROP CONSTRAINT "FK_aafe394f1c486dd54aeee50ff30"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_reports" DROP CONSTRAINT "FK_06a303e4c7552cb639bb00e359c"`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_report_criteria" DROP CONSTRAINT "FK_696978735b0f7d24aa53a6693bc"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_moderation_cases_targettype_enum_old" AS ENUM('post', 'conversation')`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ALTER COLUMN "targetType" TYPE "public"."rillo_moderation_cases_targettype_enum_old" USING "targetType"::"text"::"public"."rillo_moderation_cases_targettype_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_moderation_cases_targettype_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_moderation_cases_targettype_enum_old" RENAME TO "rillo_moderation_cases_targettype_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049" UNIQUE ("targetType", "postId", "conversationId")`);
        await queryRunner.query(`DROP TABLE "rillo_comment_reports"`);
        await queryRunner.query(`DROP TABLE "rillo_comment_report_criteria"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_comment_report_criteria_criteria_enum"`);
    }

}
