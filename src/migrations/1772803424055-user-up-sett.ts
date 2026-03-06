import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUpSett1772803424055 implements MigrationInterface {
    name = 'UserUpSett1772803424055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_show_your_birth_date" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_show_your_location_on_profile" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_disable_private_chats" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_enable_notifications" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "is_Save_your_activity_on_this_device" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_Save_your_activity_on_this_device"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_enable_notifications"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_disable_private_chats"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_show_your_location_on_profile"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "is_show_your_birth_date"`);
    }

}
