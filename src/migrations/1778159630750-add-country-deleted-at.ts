import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCountryDeletedAt1778159630750 implements MigrationInterface {
  name = 'AddCountryDeletedAt1778159630750';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rillo_countries" ADD "deleted_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "rillo_countries" DROP COLUMN "deleted_at"`,
    );
  }
}
