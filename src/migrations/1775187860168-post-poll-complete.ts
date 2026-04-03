import { MigrationInterface, QueryRunner } from "typeorm";

export class PostPollComplete1775187860168 implements MigrationInterface {
    name = 'PostPollComplete1775187860168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "isPollComplete" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "isPollComplete"`);
    }

}
