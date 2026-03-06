import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUp1772789344545 implements MigrationInterface {
    name = 'UserUp1772789344545'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "account_delete_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "account_delete_at"`);
    }

}
