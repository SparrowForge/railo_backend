import { MigrationInterface, QueryRunner } from "typeorm";

export class UserLanguage1772558101734 implements MigrationInterface {
    name = 'UserLanguage1772558101734'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_users_language_enum" AS ENUM('Arabic', 'English')`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "language" "public"."rillo_users_language_enum" DEFAULT 'English'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "language"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_users_language_enum"`);
    }

}
