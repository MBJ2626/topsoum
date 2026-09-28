// Nom affiche d'un produit. `model` contient deja le nom complet scrape
// (ex: "Smartphone Lesia Young 1 | 2Go / 16Go | Bleu") : on ne prefixe la
// marque que si elle n'y figure pas, pour eviter "Lesia Smartphone Lesia ...".
// Ne jamais afficher `canonical_name` : c'est une cle technique de matching.
export function productDisplayName(product: { brand: string; model: string }): string {
  const model = product.model.trim();
  if (model.toLowerCase().includes(product.brand.trim().toLowerCase())) {
    return model;
  }
  return `${product.brand} ${model}`;
}
