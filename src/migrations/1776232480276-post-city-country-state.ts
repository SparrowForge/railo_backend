import { MigrationInterface, QueryRunner } from "typeorm";

export class PostCityCountryState1776232480276 implements MigrationInterface {
    name = 'PostCityCountryState1776232480276'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "area" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "city" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "country" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "area"`);
    }

}
