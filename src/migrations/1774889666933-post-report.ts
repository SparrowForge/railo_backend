import { MigrationInterface, QueryRunner } from "typeorm";

export class PostReport1774889666933 implements MigrationInterface {
    name = 'PostReport1774889666933'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_post_report_criteria_criteria_enum" AS ENUM('TERRORISM', 'HARASSMENT', 'HATE_SPEECH', 'SPAM', 'IMPERSONATION', 'VIOLENCE')`);
        await queryRunner.query(`CREATE TABLE "rillo_post_report_criteria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reportId" uuid NOT NULL, "criteria" "public"."rillo_post_report_criteria_criteria_enum" NOT NULL, CONSTRAINT "UQ_ed7a53c8a43830a3fd49754b905" UNIQUE ("reportId", "criteria"), CONSTRAINT "PK_98b3b861cb72fa7b6c1cee43ba9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_post_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8895add108bc85cc582bb3f8a09" UNIQUE ("postId", "userId"), CONSTRAINT "PK_27f45b4463b3a08bf8892c0225d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_post_report_criteria" ADD CONSTRAINT "FK_3d4e4afff759efd9b928d05293f" FOREIGN KEY ("reportId") REFERENCES "rillo_post_reports"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_reports" ADD CONSTRAINT "FK_fbc96bbedbdc2e9b77162dc973c" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_reports" ADD CONSTRAINT "FK_0cfa362c0643aa78d1e49a97589" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_reports" DROP CONSTRAINT "FK_0cfa362c0643aa78d1e49a97589"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_reports" DROP CONSTRAINT "FK_fbc96bbedbdc2e9b77162dc973c"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_report_criteria" DROP CONSTRAINT "FK_3d4e4afff759efd9b928d05293f"`);
        await queryRunner.query(`DROP TABLE "rillo_post_reports"`);
        await queryRunner.query(`DROP TABLE "rillo_post_report_criteria"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_post_report_criteria_criteria_enum"`);
    }

}
