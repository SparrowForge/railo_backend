import { MigrationInterface, QueryRunner } from "typeorm";

export class ChatReport1774971153133 implements MigrationInterface {
    name = 'ChatReport1774971153133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_chat_report_criteria_criteria_enum" AS ENUM('TERRORISM', 'HARASSMENT', 'HATE_SPEECH', 'SPAM', 'IMPERSONATION', 'VIOLENCE')`);
        await queryRunner.query(`CREATE TABLE "rillo_chat_report_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportId" uuid NOT NULL, "criteria" "public"."rillo_chat_report_criteria_criteria_enum" NOT NULL, CONSTRAINT "UQ_b8726a16d2e4c60a782a5066a42" UNIQUE ("reportId", "criteria"), CONSTRAINT "PK_05f851c1079b756de60816a0bdb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_chat_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "loggedInUserId" uuid NOT NULL, "targetUserId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "userId" uuid, CONSTRAINT "UQ_7ae4e011494229829a6feaf4f11" UNIQUE ("loggedInUserId", "targetUserId"), CONSTRAINT "PK_bda7d25db1d6df53622d14aad27" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_report_criteria" ADD CONSTRAINT "FK_06f183130bb2e355f64f01435d5" FOREIGN KEY ("reportId") REFERENCES "rillo_chat_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "FK_0f836dd160b8e68274329436e34" FOREIGN KEY ("loggedInUserId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" ADD CONSTRAINT "FK_91e2cb4fac514c8d6371af25cfb" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_message" ADD CONSTRAINT "FK_08a848475c500aacc26cfb2a4d6" FOREIGN KEY ("sender_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_message" DROP CONSTRAINT "FK_08a848475c500aacc26cfb2a4d6"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "FK_91e2cb4fac514c8d6371af25cfb"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_reports" DROP CONSTRAINT "FK_0f836dd160b8e68274329436e34"`);
        await queryRunner.query(`ALTER TABLE "rillo_chat_report_criteria" DROP CONSTRAINT "FK_06f183130bb2e355f64f01435d5"`);
        await queryRunner.query(`DROP TABLE "rillo_chat_reports"`);
        await queryRunner.query(`DROP TABLE "rillo_chat_report_criteria"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_chat_report_criteria_criteria_enum"`);
    }

}
