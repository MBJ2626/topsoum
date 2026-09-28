// Seed minimal pour la CI : les tests d'integration de apps/api (favoris,
// admin) supposent un utilisateur deja en base (voir tests/test_favorites_route.py,
// tests/test_admin_route.py), normalement seede manuellement en dev local.
// Ce script cree cet unique utilisateur de test sur une DB fraiche (CI).
import { prisma } from "@topsoum/db-schema";

async function main(): Promise<void> {
  await prisma.user.upsert({
    where: { email: "ci-test-user@topsoum.test" },
    update: {},
    create: { email: "ci-test-user@topsoum.test", name: "CI Test User", isAdmin: true },
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
