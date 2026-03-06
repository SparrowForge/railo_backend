import { MigrationInterface, QueryRunner } from "typeorm";

export class ContactUp1772788255794 implements MigrationInterface {
    name = 'ContactUp1772788255794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_contact" DROP CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057"`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ADD CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_contact" DROP CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057"`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_contact" ADD CONSTRAINT "FK_0bf769ebbbb8f63dbbda0997057" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
