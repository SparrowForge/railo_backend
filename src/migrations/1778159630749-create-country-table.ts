import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCountryTable1778159630749 implements MigrationInterface {
  name = 'CreateCountryTable1778159630749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "rillo_countries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "country_name" character varying(255) NOT NULL, "country_code" character varying(10) NOT NULL, "phone_code" character varying(20) NOT NULL, CONSTRAINT "PK_8f2b2bc0d5b8df3c5a49bc5a8fd" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rillo_countries"`);
  }
}
