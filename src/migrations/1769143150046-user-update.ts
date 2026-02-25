import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUpdate1769143150046 implements MigrationInterface {
    name = 'UserUpdate1769143150046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "date_of_birth" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_gender_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "gender" "public"."rillo_users_gender_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "user_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD CONSTRAINT "UQ_a9634ffb4f8387a1b7d3f6c2daf" UNIQUE ("user_name")`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "display_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "bio" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ALTER COLUMN "phone_no" SET NOT NULL`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_users_role_enum" RENAME TO "rillo_users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ALTER COLUMN "role" TYPE "public"."rillo_users_role_enum" USING "role"::"text"::"public"."rillo_users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD CONSTRAINT "FK_ef4c2c19238df902deab1bf3f30" FOREIGN KEY ("file_id") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP CONSTRAINT "FK_ef4c2c19238df902deab1bf3f30"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_role_enum_old" AS ENUM('ADMIN', 'TEACHER', 'STUDENT')`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ALTER COLUMN "role" TYPE "public"."rillo_users_role_enum_old" USING "role"::"text"::"public"."rillo_users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_users_role_enum_old" RENAME TO "rillo_users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ALTER COLUMN "phone_no" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "display_name"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "file_id"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP CONSTRAINT "UQ_a9634ffb4f8387a1b7d3f6c2daf"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "user_name"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "date_of_birth"`);
    }

}
