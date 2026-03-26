import { MigrationInterface, QueryRunner } from "typeorm";

export class PostLinkUrl1774518723146 implements MigrationInterface {
    name = 'PostLinkUrl1774518723146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "linkUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "linkUrl"`);
    }

}
