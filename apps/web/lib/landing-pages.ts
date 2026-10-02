// Landing pages SEO : une page par requete
// populaire, servie a /meilleur-prix/{slug}. Ajouter une requete = ajouter
// une entree ici. Une page sans produit est en noindex et absente du sitemap :
// elle s'active d'elle-meme quand le catalogue couvre la requete.

export interface LandingPage {
  slug: string;
  /** Libelle court du lien "Comparatifs" de l'accueil. */
  label: string;
  /** Titre de l'onglet et de Google (suffixe " | TopSoum" ajoute par le layout). */
  title: string;
  h1: string;
  description: string;
  /** Texte d'introduction propre a la page (evite le contenu duplique). */
  intro: string;
  /** Criteres passes a l'API de recherche. */
  query?: string;
  category?: string;
  /** Prix maximum (TND) du meilleur deal, filtre cote serveur web. */
  maxPrice?: number;
}

export const LANDING_PAGES: readonly LandingPage[] = [
  {
    slug: "smartphone",
    label: "Smartphones",
    title: "Meilleur prix smartphone en Tunisie",
    h1: "Meilleur prix smartphone en Tunisie",
    description:
      "Comparez les prix des smartphones chez Tunisianet, MyTek et Spacenet et trouvez le meilleur deal en Tunisie.",
    intro:
      "Tous les smartphones suivis par TopSoum, classés du meilleur deal au moins bon : le prix, les frais de livraison et la fiabilité du revendeur sont pris en compte.",
    category: "smartphones",
  },
  {
    slug: "smartphone-pas-cher",
    label: "Smartphones pas chers",
    title: "Smartphone pas cher en Tunisie (moins de 300 TND)",
    h1: "Smartphone pas cher en Tunisie",
    description:
      "Les smartphones à moins de 300 TND chez les revendeurs tunisiens, comparés au meilleur prix.",
    intro:
      "Une sélection des smartphones dont le meilleur prix est inférieur à 300 TND, comparés chez tous les revendeurs suivis.",
    category: "smartphones",
    maxPrice: 300,
  },
  {
    slug: "lesia-young-6",
    label: "Lesia Young 6",
    title: "Meilleur prix Lesia Young 6 en Tunisie",
    h1: "Lesia Young 6 au meilleur prix en Tunisie",
    description: "Comparez le prix du Lesia Young 6 dans tous ses coloris chez les revendeurs tunisiens.",
    intro: "Le Lesia Young 6 dans tous ses coloris et toutes ses versions, comparé chez les revendeurs tunisiens.",
    query: "lesia young 6",
  },
  {
    slug: "lesia-young-1",
    label: "Lesia Young 1",
    title: "Meilleur prix Lesia Young 1 en Tunisie",
    h1: "Lesia Young 1 au meilleur prix en Tunisie",
    description: "Comparez le prix du Lesia Young 1 dans tous ses coloris chez les revendeurs tunisiens.",
    intro: "Le Lesia Young 1 dans tous ses coloris, comparé chez les revendeurs tunisiens.",
    query: "lesia young 1",
  },
  {
    slug: "iphone-15",
    label: "iPhone 15",
    title: "Meilleur prix iPhone 15 en Tunisie",
    h1: "iPhone 15 au meilleur prix en Tunisie",
    description: "Comparez le prix de l'iPhone 15 chez les revendeurs tunisiens et trouvez le meilleur deal.",
    intro: "Toutes les versions de l'iPhone 15 (capacités et coloris), comparées chez les revendeurs tunisiens.",
    query: "iphone 15",
  },
  {
    slug: "pc-portable-pas-cher",
    label: "PC portables pas chers",
    title: "PC portable pas cher en Tunisie (moins de 1500 TND)",
    h1: "PC portable pas cher en Tunisie",
    description: "Les PC portables à moins de 1500 TND chez les revendeurs tunisiens, comparés au meilleur prix.",
    intro: "Une sélection des PC portables dont le meilleur prix est inférieur à 1500 TND.",
    category: "pc-portables",
    maxPrice: 1500,
  },
];

export function findLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((page) => page.slug === slug);
}
