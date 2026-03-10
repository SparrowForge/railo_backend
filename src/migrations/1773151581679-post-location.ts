import { MigrationInterface, QueryRunner } from "typeorm";

export class PostLocation1773151581679 implements MigrationInterface {
    name = 'PostLocation1773151581679'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "longitude" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "latitude" integer`);
    }

}
