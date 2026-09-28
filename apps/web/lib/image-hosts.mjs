// Domaines des images produit des vendeurs, optimisees par next/image
// (redimensionnement, AVIF/WebP, cache). Source unique partagee entre
// next.config.mjs (images.remotePatterns) et components/ui/ProductImage.tsx.
// Ajouter un vendeur = ajouter son domaine d'images ici ; en attendant, ses
// images s'affichent quand meme, sans optimisation (repli sur <img>).
export const PRODUCT_IMAGE_HOSTS = ["www.tunisianet.com.tn", "www.mytek.tn", "spacenet.tn"];
