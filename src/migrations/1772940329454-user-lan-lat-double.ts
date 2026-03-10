import { MigrationInterface, QueryRunner } from "typeorm";

export class UserLanLatDouble1772940329454 implements MigrationInterface {
    name = 'UserLanLatDouble1772940329454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users_location" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ADD "latitude" double precision NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ADD "longitude" double precision NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users_location" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ADD "longitude" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ADD "latitude" integer NOT NULL`);
    }

}
