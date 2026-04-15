import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactCatagoryEnumUp1776228530258 implements MigrationInterface {
    name = 'ContactCatagoryEnumUp1776228530258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."rillo_contact_contact_catagory_enum" RENAME TO "rillo_contact_contact_catagory_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_contact_contact_catagory_enum" AS ENUM('Bug Report', 'Feature Request', 'Account Issues', 'Feedback & Suggesttions', 'Partnership Inquiry', 'Payment & Billing', 'Other')`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" TYPE "public"."rillo_contact_contact_catagory_enum" USING "contact_catagory"::"text"::"public"."rillo_contact_contact_catagory_enum"`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" SET DEFAULT 'Other'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_contact_contact_catagory_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_contact_contact_catagory_enum_old" AS ENUM('Bug Report', 'Feature Reqest', 'Account Issues', 'Feedback & Suggesttions', 'Partnership Inquiry', 'Payment & Billing', 'Other')`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" TYPE "public"."rillo_contact_contact_catagory_enum_old" USING "contact_catagory"::"text"::"public"."rillo_contact_contact_catagory_enum_old"`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "contact_catagory" SET DEFAULT 'Other'`);
        await queryRunner.query(`DROP TYPE "public"."rillo_contact_contact_catagory_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."rillo_contact_contact_catagory_enum_old" RENAME TO "rillo_contact_contact_catagory_enum"`);
    }

}
