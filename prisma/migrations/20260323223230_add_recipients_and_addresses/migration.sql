-- CreateEnum
CREATE TYPE "identification_type" AS ENUM ('personal_id', 'tax_id', 'passport', 'company_id', 'other');

-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identity_document_type" "identification_type" NOT NULL,
    "identity_document_number" TEXT NOT NULL,
    "identity_issuing_country" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipient_addresses" (
    "id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "complement" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "recipient_addresses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "recipient_addresses" ADD CONSTRAINT "recipient_addresses_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
