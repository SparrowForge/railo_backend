import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentGateway1775528340556 implements MigrationInterface {
    name = 'PaymentGateway1775528340556'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_subscription_payments_status_enum" AS ENUM('created', 'initiated', 'pending', 'paid', 'failed', 'canceled', 'expired', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "rillo_subscription_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "subscription_package_id" uuid NOT NULL, "status" "public"."rillo_subscription_payments_status_enum" NOT NULL DEFAULT 'created', "provider" character varying(50) NOT NULL DEFAULT 'myfatoorah', "amount" double precision NOT NULL DEFAULT '0', "currency" character varying(10) NOT NULL DEFAULT 'KWD', "myfatoorah_invoice_id" character varying(100), "myfatoorah_payment_id" character varying(255), "myfatoorah_invoice_reference" character varying(255), "gateway_response" jsonb, "webhook_payload" jsonb, "paid_at" TIMESTAMP, "failed_at" TIMESTAMP, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_89c5c0ba27e0a9bf0fc55ff646c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_user_subscriptions_status_enum" AS ENUM('active', 'expired', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "rillo_user_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "subscription_package_id" uuid NOT NULL, "subscription_payment_id" uuid NOT NULL, "status" "public"."rillo_user_subscriptions_status_enum" NOT NULL DEFAULT 'active', "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_d371327a8ff90dbe5c028e2ae0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_subscription_payments" ADD CONSTRAINT "FK_359ad5c65b75f309d21084342db" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_subscription_payments" ADD CONSTRAINT "FK_ed6a554566b667b0cc5e4828973" FOREIGN KEY ("subscription_package_id") REFERENCES "rillo_subscription_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" ADD CONSTRAINT "FK_aefa4198e0e544865d281656f2c" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" ADD CONSTRAINT "FK_697b89679c9a09811b0a2466425" FOREIGN KEY ("subscription_package_id") REFERENCES "rillo_subscription_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" ADD CONSTRAINT "FK_35738d36c00ac1862b636ed7741" FOREIGN KEY ("subscription_payment_id") REFERENCES "rillo_subscription_payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" DROP CONSTRAINT "FK_35738d36c00ac1862b636ed7741"`);
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" DROP CONSTRAINT "FK_697b89679c9a09811b0a2466425"`);
        await queryRunner.query(`ALTER TABLE "rillo_user_subscriptions" DROP CONSTRAINT "FK_aefa4198e0e544865d281656f2c"`);
        await queryRunner.query(`ALTER TABLE "rillo_subscription_payments" DROP CONSTRAINT "FK_ed6a554566b667b0cc5e4828973"`);
        await queryRunner.query(`ALTER TABLE "rillo_subscription_payments" DROP CONSTRAINT "FK_359ad5c65b75f309d21084342db"`);
        await queryRunner.query(`DROP TABLE "rillo_user_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_user_subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_subscription_payments"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_subscription_payments_status_enum"`);
    }

}
