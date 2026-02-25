import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationsUserId1770212105138 implements MigrationInterface {
    name = 'NotificationsUserId1770212105138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" DROP COLUMN "notificationType"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_notification_records_notificationtype_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_notification_records_notificationtype_enum" AS ENUM('Push Notifications', 'Email', 'Both')`);
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" ADD "notificationType" "public"."rillo_notification_records_notificationtype_enum" NOT NULL DEFAULT 'Both'`);
    }

}
