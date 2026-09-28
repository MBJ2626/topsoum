import Image from "next/image";

import { PRODUCT_IMAGE_HOSTS } from "@/lib/image-hosts.mjs";

interface ProductImageProps {
  src: string;
  alt: string;
  /** Largeur affichee, pour que next/image serve la bonne taille (ex: "48px"). */
  sizes: string;
  /** Image principale visible au chargement (LCP) : chargee en priorite, jamais en lazy. */
  priority?: boolean;
}

function isOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && PRODUCT_IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Photo produit remplissant son conteneur (qui doit etre `relative` et dimensionne).
 * Vendeur connu : next/image (taille adaptee, AVIF/WebP, cache, servie depuis
 * notre domaine). Domaine inconnu : <img> brut plutot qu'une page en erreur.
 */
export function ProductImage({ src, alt, sizes, priority = false }: ProductImageProps) {
  if (!isOptimizable(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- repli pour un domaine absent de PRODUCT_IMAGE_HOSTS
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className="absolute inset-0 h-full w-full object-contain"
      />
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain" />;
}
