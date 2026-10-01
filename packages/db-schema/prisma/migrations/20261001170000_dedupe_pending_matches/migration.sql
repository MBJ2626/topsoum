-- Chaque rechargement de l'ETL recreait la meme suggestion "a valider". On
-- garde une suggestion par (vendeur, annonce, produit suggere) : de preference
-- celle deja tranchee par l'admin (approuvee, rejetee, fusionnee), sinon la
-- plus ancienne. Puis on interdit les doublons pour l'avenir.
DELETE FROM "pending_matches"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
             PARTITION BY "vendor_slug", "external_id", "candidate_product_id"
             ORDER BY ("status" = 'pending'), "created_at", "id"
           ) AS rank
    FROM "pending_matches"
  ) ranked
  WHERE ranked.rank > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "pending_matches_vendor_slug_external_id_candidate_product_i_key" ON "pending_matches"("vendor_slug", "external_id", "candidate_product_id");
