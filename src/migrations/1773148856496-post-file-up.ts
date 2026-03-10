import { MigrationInterface, QueryRunner } from "typeorm";

export class PostFileUp1773148856496 implements MigrationInterface {
    name = 'PostFileUp1773148856496'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "fileId" integer`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD CONSTRAINT "FK_22c98cbac0bd649097d9ecd487b" FOREIGN KEY ("fileId") REFERENCES "rillo_files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP CONSTRAINT "FK_22c98cbac0bd649097d9ecd487b"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP COLUMN "fileId"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD "fileId" uuid`);
    }

}
