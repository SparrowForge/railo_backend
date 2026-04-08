import { MigrationInterface, QueryRunner } from "typeorm";

export class BoostPayment1775648289445 implements MigrationInterface {
    name = 'BoostPayment1775648289445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_boost_packages" RENAME COLUMN "duration" TO "boostQuantity"`);
        await queryRunner.query(`CREATE TABLE "rillo_boost_payment_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "boost_package_id" uuid NOT NULL, "post_id" uuid NOT NULL, "is_success" boolean NOT NULL DEFAULT false, "message" character varying(255), "validation_errors" jsonb, "invoice_id" bigint, "invoice_status" character varying(100), "invoice_reference" character varying(255), "customer_reference" character varying(255), "provider_created_at" TIMESTAMP, "expiry_date" date, "expiry_time" character varying(50), "invoice_value" double precision, "comments" text, "customer_name" character varying(255), "customer_mobile" character varying(50), "customer_email" character varying(255), "user_defined_field" character varying(255), "invoice_display_value" character varying(100), "due_deposit" double precision, "deposit_status" character varying(100), "invoice_items" jsonb, "invoice_transactions" jsonb, "suppliers" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f07f7ea888b9a40c5ae7c4804c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD CONSTRAINT "FK_6565cffaa857b1f54518b64cb47" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD CONSTRAINT "FK_0d207266e8a64678f493da57be0" FOREIGN KEY ("boost_package_id") REFERENCES "rillo_boost_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD CONSTRAINT "FK_58f51ef0d363db9f21017e24eed" FOREIGN KEY ("post_id") REFERENCES "rillo_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP CONSTRAINT "FK_58f51ef0d363db9f21017e24eed"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP CONSTRAINT "FK_0d207266e8a64678f493da57be0"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP CONSTRAINT "FK_6565cffaa857b1f54518b64cb47"`);
        await queryRunner.query(`DROP TABLE "rillo_boost_payment_records"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_packages" RENAME COLUMN "boostQuantity" TO "duration"`);
    }

}
