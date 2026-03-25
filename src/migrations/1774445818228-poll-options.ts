import { MigrationInterface, QueryRunner } from "typeorm";

export class PollOptions1774445818228 implements MigrationInterface {
    name = 'PollOptions1774445818228'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_poll_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "remarks" character varying, "created_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid, CONSTRAINT "PK_00d6f1df7a2cc5b7a6517290b38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" ADD CONSTRAINT "FK_fcbd31ba25db44e2b7886f3d9b6" FOREIGN KEY ("user_id") REFERENCES "rillo_users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_poll_options" DROP CONSTRAINT "FK_fcbd31ba25db44e2b7886f3d9b6"`);
        await queryRunner.query(`DROP TABLE "rillo_poll_options"`);
    }

}
