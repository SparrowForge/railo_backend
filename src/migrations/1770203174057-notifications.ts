import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications1770203174057 implements MigrationInterface {
    name = 'Notifications1770203174057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_user_to_firebase_token_map" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "token" character varying(512) NOT NULL, "lastActiveAt" TIMESTAMP, CONSTRAINT "PK_85b7ceb0a0cc2efb5181f65f50e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_notification_records_notificationtype_enum" AS ENUM('Push Notifications', 'Email', 'Both')`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_notification_records_deliverystatus_enum" AS ENUM('Delivered', 'Pending')`);
        await queryRunner.query(`CREATE TABLE "rillo_notification_records" ("id" SERIAL NOT NULL, "userId" uuid, "notificationType" "public"."rillo_notification_records_notificationtype_enum" NOT NULL DEFAULT 'Both', "notificationTitle" character varying(255) NOT NULL, "notificationMessage" character varying(255) NOT NULL, "deliveryStatus" "public"."rillo_notification_records_deliverystatus_enum" DEFAULT 'Pending', "isSeen" boolean DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_23c5656abdb7edcc66285e5c1e4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_user_to_firebase_token_map" ADD CONSTRAINT "FK_4239f73b322517e1b7b87f23d9c" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" ADD CONSTRAINT "FK_6f62a8e3484b3cd76abe03684ed" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_notification_records" DROP CONSTRAINT "FK_6f62a8e3484b3cd76abe03684ed"`);
        await queryRunner.query(`ALTER TABLE "rillo_user_to_firebase_token_map" DROP CONSTRAINT "FK_4239f73b322517e1b7b87f23d9c"`);
        await queryRunner.query(`DROP TABLE "rillo_notification_records"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_notification_records_deliverystatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_notification_records_notificationtype_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_user_to_firebase_token_map"`);
    }

}
