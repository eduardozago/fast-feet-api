-- CreateTable
CREATE TABLE "proofs_of_delivery" (
    "id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "courier_id" TEXT NOT NULL,
    "received_by_name" TEXT NOT NULL,
    "received_by_document" TEXT,
    "recipient_relationship" TEXT NOT NULL,
    "proof_type" TEXT NOT NULL,
    "proof_image_url" TEXT,
    "latitude" DECIMAL(8,6),
    "longitude" DECIMAL(9,6),
    "distance_from_destination_in_km" DECIMAL(65,30),
    "location_validation_status" TEXT NOT NULL,
    "document_matches_recipient" BOOLEAN NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proofs_of_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proofs_of_delivery_delivery_id_key" ON "proofs_of_delivery"("delivery_id");

-- AddForeignKey
ALTER TABLE "proofs_of_delivery" ADD CONSTRAINT "proofs_of_delivery_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proofs_of_delivery" ADD CONSTRAINT "proofs_of_delivery_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
