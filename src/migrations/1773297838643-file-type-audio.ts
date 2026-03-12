import { MigrationInterface, QueryRunner } from "typeorm";

export class FileTypeAudio1773297838643 implements MigrationInterface {
    name = 'FileTypeAudio1773297838643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."rillo_files_file_type_enum" RENAME TO "rillo_files_file_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_files_file_type_enum" AS ENUM('document', 'receipt', 'photo', 'video', 'audio', 'other')`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" TYPE "public"."rillo_files_file_type_enum" USING "file_type"::"text"::"public"."rillo_files_file_type_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_files_file_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_files_file_type_enum_old" AS ENUM('document', 'receipt', 'photo', 'video', 'other')`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" TYPE "public"."rillo_files_file_type_enum_old" USING "file_type"::"text"::"public"."rillo_files_file_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_files" ALTER COLUMN "file_type" SET DEFAULT 'other'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_files_file_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_files_file_type_enum_old" RENAME TO "rillo_files_file_type_enum"`);
    }

}
