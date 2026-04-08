import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentRecord1775615729986 implements MigrationInterface {
    name = 'PaymentRecord1775615729986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_payments_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "subscription_package_id" uuid NOT NULL, "is_success" boolean NOT NULL DEFAULT false, "message" character varying(255), "validation_errors" jsonb, "invoice_id" bigint, "invoice_status" character varying(100), "invoice_reference" character varying(255), "customer_reference" character varying(255), "provider_created_at" TIMESTAMP, "expiry_date" date, "expiry_time" character varying(50), "invoice_value" double precision, "comments" text, "customer_name" character varying(255), "customer_mobile" character varying(50), "customer_email" character varying(255), "user_defined_field" character varying(255), "invoice_display_value" character varying(100), "due_deposit" double precision, "deposit_status" character varying(100), "invoice_items" jsonb, "invoice_transactions" jsonb, "suppliers" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_45b03434991c592b36beb4ccf88" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_payments_records" ADD CONSTRAINT "FK_594265469bf686546b7663907aa" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_payments_records" ADD CONSTRAINT "FK_1365a639a0a3ca3cfd902f4367e" FOREIGN KEY ("subscription_package_id") REFERENCES "rillo_subscription_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_payments_records" DROP CONSTRAINT "FK_1365a639a0a3ca3cfd902f4367e"`);
        await queryRunner.query(`ALTER TABLE "rillo_payments_records" DROP CONSTRAINT "FK_594265469bf686546b7663907aa"`);
        await queryRunner.query(`DROP TABLE "rillo_payments_records"`);
    }

}
