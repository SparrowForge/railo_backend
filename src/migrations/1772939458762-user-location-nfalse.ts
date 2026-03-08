import { MigrationInterface, QueryRunner } from "typeorm";

export class UserLocationNfalse1772939458762 implements MigrationInterface {
    name = 'UserLocationNfalse1772939458762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ALTER COLUMN "latitude" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ALTER COLUMN "longitude" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ALTER COLUMN "longitude" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_users_location" ALTER COLUMN "latitude" DROP NOT NULL`);
    }

}
