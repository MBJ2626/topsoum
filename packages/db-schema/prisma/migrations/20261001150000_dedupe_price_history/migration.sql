-- Les rechargements de l'ETL ont insere le meme releve plusieurs fois
-- (meme offre, meme horodatage). On garde un releve par couple, puis on
-- interdit les doublons pour l'avenir.
DELETE FROM "price_history" a
USING "price_history" b
WHERE a."offer_id" = b."offer_id"
  AND a."recorded_at" = b."recorded_at"
  AND a."id" > b."id";

-- DropIndex
DROP INDEX "price_history_offer_id_recorded_at_idx";

-- CreateIndex
CREATE UNIQUE INDEX "price_history_offer_id_recorded_at_key" ON "price_history"("offer_id", "recorded_at");
