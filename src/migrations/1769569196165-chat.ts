import { MigrationInterface, QueryRunner } from "typeorm";

export class Chat1769569196165 implements MigrationInterface {
    name = 'Chat1769569196165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_posttype_enum" AS ENUM('audio', 'location', 'time_line', 'link', 'regular', 'camera', 'photo')`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_posts_visibility_enum" AS ENUM('ghost', 'normal')`);
        await queryRunner.query(`CREATE TABLE "rillo_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text, "postType" "public"."rillo_posts_posttype_enum" NOT NULL DEFAULT 'regular', "visibility" "public"."rillo_posts_visibility_enum" NOT NULL DEFAULT 'normal', "fileId" uuid, "locationId" uuid, "userId" uuid NOT NULL, "likeCount" integer NOT NULL DEFAULT '0', "commentCount" integer NOT NULL DEFAULT '0', "shareCount" integer NOT NULL DEFAULT '0', "originalPostId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_e2d17ce4d5cc6027cd2f671b360" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_de071e5e776235cc5dca2eb304" ON "rillo_posts" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "rillo_post_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1c9de69b26703fde21f30055c20" UNIQUE ("postId", "userId"), CONSTRAINT "PK_ad9a69d3026b229fb78d05e84eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "followerId" uuid NOT NULL, "followingId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe8951a7851078f3f6be2ae2c12" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_83419349a425b62c464d762fad1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7db96bb85e075d153a7e4b0a6" ON "rillo_follows" ("followingId") `);
        await queryRunner.query(`CREATE INDEX "IDX_20529152c00a3bf2da9ecb3ed3" ON "rillo_follows" ("followerId") `);
        await queryRunner.query(`CREATE TABLE "rillo_conversation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_one_id" uuid NOT NULL, "user_two_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99b49aff048783cf3a2375740cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_conversation_clear" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "cleared_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_ecf52a834df47dd1e6a955f977b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "postId" uuid NOT NULL, "userId" uuid NOT NULL, "parentId" uuid, "likeCount" integer NOT NULL DEFAULT '0', "replyCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_bb3ea6042541ace0eec64fdc722" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9f0e63dd401559ce88f2b646c6" ON "rillo_comments" ("postId", "createdAt") `);
        await queryRunner.query(`CREATE TABLE "rillo_comment_likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "commentId" uuid NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a54cc6a5d08beba50fcd6517513" UNIQUE ("commentId", "userId"), CONSTRAINT "PK_107fe6efb8790a5b9baf6b8b339" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_chat_request_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "rillo_chat_request" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sender_id" uuid NOT NULL, "receiver_id" uuid NOT NULL, "status" "public"."rillo_chat_request_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bb74205739234a9e7ed1a8b2f60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."rillo_message_status_enum" AS ENUM('sent', 'delivered', 'read')`);
        await queryRunner.query(`CREATE TABLE "rillo_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "sender_id" uuid NOT NULL, "text" text NOT NULL, "reply_to_message_id" uuid, "status" "public"."rillo_message_status_enum" NOT NULL DEFAULT 'sent', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1dadef9c700589edd59fc67494a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_conversation_mute" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "muted_until" TIMESTAMP, CONSTRAINT "PK_5965bf6262baa8ae47af6e93027" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rillo_conversation_read" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" uuid NOT NULL, "last_read_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_fe7c1281c19201ae66a278a3828" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rillo_users" ADD "last_seen_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" ADD CONSTRAINT "FK_ba32cf92e4e5fed1cab7a954a95" FOREIGN KEY ("originalPostId") REFERENCES "rillo_posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_post_likes" ADD CONSTRAINT "FK_01302b046f62a36bba9ca8e2b97" FOREIGN KEY ("postId") REFERENCES "rillo_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comments" ADD CONSTRAINT "FK_3add13e94aede81f7c7a474a866" FOREIGN KEY ("parentId") REFERENCES "rillo_comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rillo_comment_likes" ADD CONSTRAINT "FK_344b0dc69ec5e035ee0bf294a16" FOREIGN KEY ("commentId") REFERENCES "rillo_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rillo_comment_likes" DROP CONSTRAINT "FK_344b0dc69ec5e035ee0bf294a16"`);
        await queryRunner.query(`ALTER TABLE "rillo_comments" DROP CONSTRAINT "FK_3add13e94aede81f7c7a474a866"`);
        await queryRunner.query(`ALTER TABLE "rillo_post_likes" DROP CONSTRAINT "FK_01302b046f62a36bba9ca8e2b97"`);
        await queryRunner.query(`ALTER TABLE "rillo_posts" DROP CONSTRAINT "FK_ba32cf92e4e5fed1cab7a954a95"`);
        await queryRunner.query(`ALTER TABLE "rillo_users" DROP COLUMN "last_seen_at"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation_read"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation_mute"`);
        await queryRunner.query(`DROP TABLE "rillo_message"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_message_status_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_chat_request"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_chat_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "rillo_comment_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f0e63dd401559ce88f2b646c6"`);
        await queryRunner.query(`DROP TABLE "rillo_comments"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation_clear"`);
        await queryRunner.query(`DROP TABLE "rillo_conversation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_20529152c00a3bf2da9ecb3ed3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7db96bb85e075d153a7e4b0a6"`);
        await queryRunner.query(`DROP TABLE "rillo_follows"`);
        await queryRunner.query(`DROP TABLE "rillo_post_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de071e5e776235cc5dca2eb304"`);
        await queryRunner.query(`DROP TABLE "rillo_posts"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."rillo_posts_posttype_enum"`);
    }

}
