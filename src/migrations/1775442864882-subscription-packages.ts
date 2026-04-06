import { MigrationInterface, QueryRunner } from "typeorm";

export class SubscriptionPackages1775442864882 implements MigrationInterface {
    name = 'SubscriptionPackages1775442864882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_subscription_package_benifits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subscription_package_id" uuid NOT NULL, "desc" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_2c727cb43fbfe08db69b88dabcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_subscription_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" double precision NOT NULL DEFAULT '0', "discountPercentage" double precision DEFAULT '0', "discountPrice" double precision NOT NULL DEFAULT '0', "duration" integer NOT NULL DEFAULT '0', "type" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_21f70b5791143f4bfa4756328a2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_subscription_package_benifits" ADD CONSTRAINT "FK_10616e3fddc1a89bbbb652786d4" FOREIGN KEY ("subscription_package_id") REFERENCES "rillo_subscription_packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_subscription_package_benifits" DROP CONSTRAINT "FK_10616e3fddc1a89bbbb652786d4"`);
        await queryRunner.query(`DROP TABLE "rillo_subscription_packages"`);
        await queryRunner.query(`DROP TABLE "rillo_subscription_package_benifits"`);
    }

}
