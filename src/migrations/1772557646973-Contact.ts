import { MigrationInterface, QueryRunner } from "typeorm";

export class Contact1772557646973 implements MigrationInterface {
    name = 'Contact1772557646973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_contact_contact_catagory_enum" AS ENUM('Bug Report', 'Feature Reqest', 'Account Issues', 'Feedback & Suggesttions', 'Partnership Inquiry', 'Payment & Billing', 'Other')`);
        await queryRunner.query(`CREATE TABLE "rillo_contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contact_catagory" "public"."rillo_contact_contact_catagory_enum" NOT NULL DEFAULT 'Other', "remarks" character varying, "user_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_37f26910cba3b134f3d114dd633" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ADD CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_contact" DROP CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057"`);
        await queryRunner.query(`DROP TABLE "rillo_contact"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_contact_contact_catagory_enum"`);
    }

}
