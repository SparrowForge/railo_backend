import { MigrationInterface, QueryRunner } from "typeorm";

export class CommentsUser1770198310648 implements MigrationInterface {
    name = 'CommentsUser1770198310648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comments" ADD CONSTRAINT "FK_595eaa757d709de514496807f11" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comments" DROP CONSTRAINT "FK_595eaa757d709de514496807f11"`);
    }

}
