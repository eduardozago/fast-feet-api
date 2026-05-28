/*
  Warnings:

  - Changed the type of `recipient_relationship` on the `proofs_of_delivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `proof_type` on the `proofs_of_delivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `location_validation_status` on the `proofs_of_delivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "recipient_relationship" AS ENUM ('recipient', 'family_member', 'doorman', 'receptionist', 'neighbor', 'other');

-- CreateEnum
CREATE TYPE "proof_type" AS ENUM ('document', 'photo', 'signature', 'manual');

-- CreateEnum
CREATE TYPE "location_validation_status" AS ENUM ('within_range', 'out_of_range', 'unavailable');

-- AlterTable
ALTER TABLE "proofs_of_delivery" DROP COLUMN "recipient_relationship",
ADD COLUMN     "recipient_relationship" "recipient_relationship" NOT NULL,
DROP COLUMN "proof_type",
ADD COLUMN     "proof_type" "proof_type" NOT NULL,
DROP COLUMN "location_validation_status",
ADD COLUMN     "location_validation_status" "location_validation_status" NOT NULL;
