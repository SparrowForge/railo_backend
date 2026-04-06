import { MigrationInterface, QueryRunner } from "typeorm";

export class UserIsSubscribedUser1775483313700 implements MigrationInterface {
    name = 'UserIsSubscribedUser1775483313700'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "isSubscribedUser" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "isSubscribedUser"`);
    }

}
