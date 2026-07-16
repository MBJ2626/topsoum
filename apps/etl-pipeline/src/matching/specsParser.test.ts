import { describe, expect, it } from "vitest";

import { canonicalizeColor, parseSpecs } from "./specsParser";

describe("parseSpecs", () => {
  it("extrait RAM, stockage et couleur d'un libelle Tunisianet a pipes", () => {
    expect(parseSpecs("Smartphone Lesia Young 1 | 2Go / 16Go | Bleu")).toEqual({
      ramGb: 2,
      extendedRamGb: null,
      storageGb: 16,
      color: "blue",
      modelTokens: ["lesia", "young", "1"],
    });
  });

  it("normalise les accents (Bleu Foncé -> dark-blue)", () => {
    const specs = parseSpecs("Smartphone LESIA YOUNG 1 2Go 16Go - Bleu Foncé");
    expect(specs.color).toBe("dark-blue");
    expect(specs.ramGb).toBe(2);
    expect(specs.storageGb).toBe(16);
  });

  it("prefere la sequence couleur la plus longue (Bleu Ciel != Bleu)", () => {
    expect(parseSpecs("Smartphone Lesia Young 1 2Go 16Go Bleu Ciel").color).toBe("sky-blue");
    expect(parseSpecs("Smartphone Lesia Young 1 2Go 16Go Bleu").color).toBe("blue");
  });

  it("parse la RAM etendue collee (2+2Go) et retire les stopwords", () => {
    expect(parseSpecs("Téléphone Portable LOGICOM LYRA | 2+2Go / 32Go | Noir")).toEqual({
      ramGb: 2,
      extendedRamGb: 2,
      storageGb: 32,
      color: "black",
      modelTokens: ["logicom", "lyra"],
    });
  });

  it("parse la RAM etendue espacee (2 + 2Go)", () => {
    const specs = parseSpecs("Smartphone Lesia Young 6 2 + 2Go 16Go - Silver");
    expect(specs.ramGb).toBe(2);
    expect(specs.extendedRamGb).toBe(2);
    expect(specs.storageGb).toBe(16);
    expect(specs.color).toBe("silver");
    expect(specs.modelTokens).toEqual(["lesia", "young", "6"]);
  });

  it("affecte une capacite unique >= 32 Go au stockage (iPhone 15 128Go)", () => {
    const specs = parseSpecs("iPhone 15 128Go Noir");
    expect(specs.storageGb).toBe(128);
    expect(specs.ramGb).toBeNull();
    expect(specs.color).toBe("black");
    expect(specs.modelTokens).toEqual(["iphone", "15"]);
  });

  it("affecte une capacite unique < 32 Go a la RAM", () => {
    const specs = parseSpecs("Smartphone Test 8Go");
    expect(specs.ramGb).toBe(8);
    expect(specs.storageGb).toBeNull();
  });

  it("gere l'espace entre valeur et unite (128 Go)", () => {
    const specs = parseSpecs("iPhone 15 128 Go Black");
    expect(specs.storageGb).toBe(128);
    expect(specs.color).toBe("black");
    expect(specs.modelTokens).toEqual(["iphone", "15"]);
  });

  it("reconnait BLEU NUIT en majuscules colle a un tiret", () => {
    const specs = parseSpecs("Smartphone Lesia Young 2 4Go 32Go  -BLEU NUIT");
    expect(specs.color).toBe("midnight-blue");
    expect(specs.ramGb).toBe(4);
    expect(specs.storageGb).toBe(32);
    expect(specs.modelTokens).toEqual(["lesia", "young", "2"]);
  });

  it("reconnait le melange anglais/francais Dark Bleu (Spacenet)", () => {
    const specs = parseSpecs("Smartphone Lesia Young 2 2Go 32Go Dark Bleu");
    expect(specs.color).toBe("dark-blue");
    expect(specs.ramGb).toBe(2);
    expect(specs.storageGb).toBe(32);
  });

  it("convertit les To en Go (1To = 1024 Go)", () => {
    const specs = parseSpecs("PC Portable Asus 16Go 1To");
    expect(specs.ramGb).toBe(16);
    expect(specs.storageGb).toBe(1024);
  });

  it("retourne des specs nulles sans capacite ni couleur reconnue", () => {
    expect(parseSpecs("Souris Logitech MX Master")).toEqual({
      ramGb: null,
      extendedRamGb: null,
      storageGb: null,
      color: null,
      modelTokens: ["souris", "logitech", "mx", "master"],
    });
  });
});

describe("canonicalizeColor", () => {
  it("normalise une couleur brute isolee", () => {
    expect(canonicalizeColor("Bleu Foncé")).toBe("dark-blue");
    expect(canonicalizeColor("NOIR")).toBe("black");
  });

  it("reconnait les couleurs observees chez Spacenet (Cyan, Titanium, Orange)", () => {
    expect(canonicalizeColor("Cyan")).toBe("cyan");
    expect(canonicalizeColor("Titanium")).toBe("titanium");
    expect(canonicalizeColor("Orange")).toBe("orange");
  });

  it("retourne null pour une couleur inconnue", () => {
    expect(canonicalizeColor("Turquoise")).toBeNull();
  });
});
