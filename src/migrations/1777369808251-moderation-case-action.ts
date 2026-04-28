import { MigrationInterface, QueryRunner } from "typeorm";

export class ModerationCaseAction1777369808251 implements MigrationInterface {
    name = 'ModerationCaseAction1777369808251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "UQ_82423ccbdd30735520726aa6a14"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP COLUMN "targetId"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD "postId" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD "conversationId" uuid`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049" UNIQUE ("targetType", "postId", "conversationId")`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "FK_582ca0235797ed21b7242303242" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "FK_6472757e29d7ae2e08385711a91" FOREIGN KEY ("conversationId") REFERENCES "rillo_conversation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "FK_6472757e29d7ae2e08385711a91"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "FK_582ca0235797ed21b7242303242"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP CONSTRAINT "UQ_9d689fec3fdf3a82674e157a049"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP COLUMN "conversationId"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" DROP COLUMN "postId"`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD "targetId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "rillo_moderation_cases" ADD CONSTRAINT "UQ_82423ccbdd30735520726aa6a14" UNIQUE ("targetType", "targetId")`);
    }

}
