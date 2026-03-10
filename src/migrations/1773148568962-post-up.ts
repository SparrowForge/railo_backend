import { MigrationInterface, QueryRunner } from "typeorm";

export class PostUp1773148568962 implements MigrationInterface {
    name = 'PostUp1773148568962'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "location" geography(Point,4326)`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "latitude" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "longitude" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "location"`);
    }

}
