import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationPayload1775484221048 implements MigrationInterface {
    name = 'NotificationPayload1775484221048'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" ADD "payload" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" DROP COLUMN "payload"`);
    }

}
