import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1769136297765 implements MigrationInterface {
    name = 'FirstMigration1769136297765'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_role_enum" AS ENUM('ADMIN', 'TEACHER', 'STUDENT')`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "rillo_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."rillo_users_role_enum" NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone_no" character varying, "password" character varying NOT NULL, "status" "public"."rillo_users_status_enum" NOT NULL DEFAULT 'active', "created_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_7777c44889122c755a270faa66a" UNIQUE ("email"), CONSTRAINT "PK_780cf033135bbf91179a2843d92" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_files_file_type_enum" AS ENUM('document', 'receipt', 'photo', 'video', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_files_file_category_enum" AS ENUM('personal', 'financial', 'medical', 'administrative', 'other')`);
        await queryRunner.query(`CREATE TABLE "rillo_files" ("id" SERIAL NOT NULL, "file_name" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "file_path" character varying(500) NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "file_type" "public"."rillo_files_file_type_enum" NOT NULL DEFAULT 'other', "file_category" "public"."rillo_files_file_category_enum" NOT NULL DEFAULT 'other', "uploaded_by" uuid, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b37e240c0ec8b6c6153a4cd48e7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_file_references" ("id" SERIAL NOT NULL, "file_id" integer NOT NULL, "resource" character varying(50) NOT NULL, "resource_id" integer NOT NULL, "reference_type" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_770684fc06993cc3c3591269d7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isRevoked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_57f35a8a2629f828032dbb96e89" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_password_reset_tokens" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_4cc084930b47355f01ec832a6a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_audit_logs" ("id" SERIAL NOT NULL, "userId" character varying, "username" character varying(255), "action" character varying(50) NOT NULL, "resource" character varying(100) NOT NULL, "resourceId" character varying(100), "method" character varying(10) NOT NULL, "url" character varying(500) NOT NULL, "ip" character varying(45) NOT NULL, "userAgent" character varying(500) NOT NULL, "requestBody" json, "responseStatus" integer NOT NULL, "responseTime" integer NOT NULL, "success" boolean NOT NULL, "error" text, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_72ce025537bebcb818e3cc3f5e3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_854fac021e960c960a30b7a306" ON "rillo_audit_logs" ("success", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_1b497577c273288a2b1f66697e" ON "rillo_audit_logs" ("action", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec7ed4bfc6c7a274fd972a8056" ON "rillo_audit_logs" ("resource", "resourceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_904c2b1f7cac53d4ce0936a76e" ON "rillo_audit_logs" ("userId", "timestamp") `);
        await queryRunner.query(`ALTER TABLE "rillo_files" ADD CONSTRAINT "FK_773e94d06ca230927883fd33b83" FOREIGN KEY ("uploaded_by") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_file_references" ADD CONSTRAINT "FK_3ef86bb37822f7f87249d460d47" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_refresh_tokens" ADD CONSTRAINT "FK_acee0f359e3d84d298de863d58a" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_password_reset_tokens" ADD CONSTRAINT "FK_5d54e98baf142dcf5c3f71e21b8" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_password_reset_tokens" DROP CONSTRAINT "FK_5d54e98baf142dcf5c3f71e21b8"`);
        await queryRunner.query(`ALTER TABLE "rillo_refresh_tokens" DROP CONSTRAINT "FK_acee0f359e3d84d298de863d58a"`);
        await queryRunner.query(`ALTER TABLE "rillo_file_references" DROP CONSTRAINT "FK_3ef86bb37822f7f87249d460d47"`);
        await queryRunner.query(`ALTER TABLE "rillo_files" DROP CONSTRAINT "FK_773e94d06ca230927883fd33b83"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_904c2b1f7cac53d4ce0936a76e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec7ed4bfc6c7a274fd972a8056"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b497577c273288a2b1f66697e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_854fac021e960c960a30b7a306"`);
        await queryRunner.query(`DROP TABLE "rillo_audit_logs"`);
        await queryRunner.query(`DROP TABLE "rillo_password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "rillo_refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "rillo_file_references"`);
        await queryRunner.query(`DROP TABLE "rillo_files"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_files_file_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_files_file_type_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_users"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_role_enum"`);
    }

}
