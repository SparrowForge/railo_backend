import { MigrationInterface, QueryRunner } from "typeorm";

export class PostUserUp1773149020381 implements MigrationInterface {
    name = 'PostUserUp1773149020381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD CONSTRAINT "FK_af7c8858abfa901716b2cb299a7" FOREIGN KEY ("userId") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP CONSTRAINT "FK_af7c8858abfa901716b2cb299a7"`);
    }

}
