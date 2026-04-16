/*
  Warnings:

  - Added the required column `latitude` to the `recipient_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `recipient_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "recipient_addresses" ADD COLUMN     "latitude" DECIMAL(8,6) NOT NULL,
ADD COLUMN     "longitude" DECIMAL(9,6) NOT NULL;
