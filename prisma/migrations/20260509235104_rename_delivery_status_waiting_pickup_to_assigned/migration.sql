/*
  Warnings:

  - The values [waiting_pickup] on the enum `delivery_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "delivery_status_new" AS ENUM ('created', 'assigned', 'in_transit', 'completed');
ALTER TABLE "public"."deliveries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "deliveries" ALTER COLUMN "status" TYPE "delivery_status_new" USING ("status"::text::"delivery_status_new");
ALTER TYPE "delivery_status" RENAME TO "delivery_status_old";
ALTER TYPE "delivery_status_new" RENAME TO "delivery_status";
DROP TYPE "public"."delivery_status_old";
ALTER TABLE "deliveries" ALTER COLUMN "status" SET DEFAULT 'created';
COMMIT;
