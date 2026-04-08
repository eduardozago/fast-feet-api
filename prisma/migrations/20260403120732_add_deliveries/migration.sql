-- CreateEnum
CREATE TYPE "delivery_status" AS ENUM ('created', 'waiting_pickup', 'in_transit', 'completed');

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "courier_id" TEXT,
    "recipient_id" TEXT NOT NULL,
    "recipient_address_id" TEXT NOT NULL,
    "status" "delivery_status" NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "recipients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_recipient_address_id_fkey" FOREIGN KEY ("recipient_address_id") REFERENCES "recipient_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
