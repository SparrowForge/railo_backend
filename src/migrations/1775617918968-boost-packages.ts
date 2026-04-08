import { MigrationInterface, QueryRunner } from "typeorm";

export class BoostPackages1775617918968 implements MigrationInterface {
    name = 'BoostPackages1775617918968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rillo_boost_package_benifits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "boost_package_id" uuid NOT NULL, "desc" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_77b21e860dc4ab9fe4f6e339d62" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_boost_packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" double precision NOT NULL DEFAULT '0', "discountPercentage" double precision DEFAULT '0', "discountPrice" double precision NOT NULL DEFAULT '0', "duration" integer NOT NULL DEFAULT '0', "type" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9b8a5fa979c3fc6c4c0ef593339" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_boost_package_benifits" ADD CONSTRAINT "FK_98d1bf9a2faf8bb7db7bfe9e8db" FOREIGN KEY ("boost_package_id") REFERENCES "rillo_boost_packages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_boost_package_benifits" DROP CONSTRAINT "FK_98d1bf9a2faf8bb7db7bfe9e8db"`);
        await queryRunner.query(`DROP TABLE "rillo_boost_packages"`);
        await queryRunner.query(`DROP TABLE "rillo_boost_package_benifits"`);
    }

}
