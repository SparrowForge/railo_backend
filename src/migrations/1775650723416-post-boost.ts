import { MigrationInterface, QueryRunner } from "typeorm";

export class PostBoost1775650723416 implements MigrationInterface {
    name = 'PostBoost1775650723416'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_post_boosts_status_enum" AS ENUM('active', 'expired', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "rillo_post_boosts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "post_id" uuid NOT NULL, "boost_package_id" uuid NOT NULL, "boost_payment_record_id" uuid NOT NULL, "purchased_quantity" integer NOT NULL DEFAULT '0', "purchased_minutes" integer NOT NULL DEFAULT '0', "starts_at" TIMESTAMP NOT NULL, "ends_at" TIMESTAMP NOT NULL, "status" "public"."rillo_post_boosts_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_80d56b7b279c2abd7f83b746e54" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "isBoostRunning" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "boostEndAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD CONSTRAINT "FK_dea307b661a95da2cf7d00eea74" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD CONSTRAINT "FK_66fd9570267af5780e4becf21c7" FOREIGN KEY ("post_id") REFERENCES "rillo_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD CONSTRAINT "FK_3a9bb6addec37e4e5aa14acdcb8" FOREIGN KEY ("boost_package_id") REFERENCES "rillo_boost_packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD CONSTRAINT "FK_64065554c093c94e7e16d3f878c" FOREIGN KEY ("boost_payment_record_id") REFERENCES "rillo_boost_payment_records"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP CONSTRAINT "FK_64065554c093c94e7e16d3f878c"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP CONSTRAINT "FK_3a9bb6addec37e4e5aa14acdcb8"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP CONSTRAINT "FK_66fd9570267af5780e4becf21c7"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP CONSTRAINT "FK_dea307b661a95da2cf7d00eea74"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "boostEndAt"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "isBoostRunning"`);
        await queryRunner.query(`DROP TABLE "rillo_post_boosts"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_post_boosts_status_enum"`);
    }

}
