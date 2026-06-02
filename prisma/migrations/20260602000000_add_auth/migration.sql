-- Fresh-start auth migration: existing global financial rows are discarded so
-- all future rows can require an owning user.
DELETE FROM "net_worth_snapshots";
DELETE FROM "liabilities";
DELETE FROM "assets";

CREATE TYPE "AccountStatus" AS ENUM ('PENDING_EMAIL_CONFIRMATION', 'ACTIVE', 'SUSPENDED');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" VARCHAR(255),
  "status" "AccountStatus" NOT NULL DEFAULT 'PENDING_EMAIL_CONFIRMATION',
  "email_verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sessions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "assets" ADD COLUMN "user_id" UUID NOT NULL;
ALTER TABLE "liabilities" ADD COLUMN "user_id" UUID NOT NULL;
ALTER TABLE "net_worth_snapshots" ADD COLUMN "user_id" UUID NOT NULL;

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
CREATE INDEX "assets_user_id_idx" ON "assets"("user_id");
CREATE INDEX "liabilities_user_id_idx" ON "liabilities"("user_id");
CREATE INDEX "net_worth_snapshots_user_id_idx" ON "net_worth_snapshots"("user_id");

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "liabilities" ADD CONSTRAINT "liabilities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
