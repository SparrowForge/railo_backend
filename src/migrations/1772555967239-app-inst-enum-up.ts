import { MigrationInterface, QueryRunner } from "typeorm";

export class AppInstEnumUp1772555967239 implements MigrationInterface {
    name = 'AppInstEnumUp1772555967239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."rillo_app_instructions_particulars_enum" RENAME TO "rillo_app_instructions_particulars_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_app_instructions_particulars_enum" AS ENUM('Distance levels in Rillo', 'Notes', 'Rillo modes')`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" TYPE "public"."rillo_app_instructions_particulars_enum" USING "particulars"::"text"::"public"."rillo_app_instructions_particulars_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" SET DEFAULT 'Notes'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_app_instructions_particulars_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_app_instructions_particulars_enum_old" AS ENUM('Distance levels in Rillo', 'Notes', 'Rillo modes:')`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" TYPE "public"."rillo_app_instructions_particulars_enum_old" USING "particulars"::"text"::"public"."rillo_app_instructions_particulars_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_app_instructions" ALTER COLUMN "particulars" SET DEFAULT 'Notes'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_app_instructions_particulars_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_app_instructions_particulars_enum_old" RENAME TO "rillo_app_instructions_particulars_enum"`);
    }

}
