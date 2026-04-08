import { MigrationInterface, QueryRunner } from "typeorm";

export class PostBoost1775665550374 implements MigrationInterface {
    name = 'PostBoost1775665550374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP COLUMN "purchased_quantity"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP COLUMN "purchased_minutes"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD "purchased_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD "used_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" ADD "remaining_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD "boost_quantity" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD "boost_minutes" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP COLUMN "boost_minutes"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" DROP COLUMN "boost_quantity"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP COLUMN "remaining_quantity"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP COLUMN "used_quantity"`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_payment_records" DROP COLUMN "purchased_quantity"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD "purchased_minutes" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "rillo_post_boosts" ADD "purchased_quantity" integer NOT NULL DEFAULT '0'`);
    }

}
