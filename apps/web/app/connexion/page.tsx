import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn } from "@/auth";
import { authConfig } from "@/auth.config";
import { ActionForm } from "@/components/ui/ActionForm";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

interface ConnexionPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

/** Chemin interne uniquement : jamais de redirection ouverte vers un autre domaine. */
function safeCallbackUrl(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/favorites";
}

function oauthProviders(): { id: string; name: string }[] {
  return (authConfig.providers ?? []).map((provider) => {
    const config = typeof provider === "function" ? provider() : provider;
    return { id: config.id, name: config.name };
  });
}

export default async function ConnexionPage({ searchParams }: ConnexionPageProps) {
  const { callbackUrl, error } = await searchParams;
  const redirectTo = safeCallbackUrl(callbackUrl);

  if (await auth()) {
    redirect(redirectTo);
  }

  async function signInWithCredentials(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo,
      });
    } catch (signInError) {
      // Le succes leve NEXT_REDIRECT : seule une AuthError est un vrai echec.
      if (signInError instanceof AuthError) {
        redirect(`/connexion?error=${signInError.type}&callbackUrl=${encodeURIComponent(redirectTo)}`);
      }
      throw signInError;
    }
  }

  const providers = oauthProviders();

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <div className="mx-auto flex max-w-md flex-col gap-5 rounded-card border border-gray-200 bg-white p-5 sm:p-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[1.75rem] font-medium leading-tight tracking-display text-gray-900">Connexion</h1>
          <p className="text-sm text-gray-600">Pour retrouver vos favoris et suivre leurs prix.</p>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error === "CredentialsSignin"
              ? "E-mail ou mot de passe incorrect."
              : "La connexion a échoué. Merci de réessayer."}
          </p>
        ) : null}

        <ActionForm
          action={signInWithCredentials}
          submitLabel="Se connecter"
          size="lg"
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              className="min-h-[44px] rounded-key border border-field bg-white px-3 text-base text-gray-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Mot de passe
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-[44px] rounded-key border border-field bg-white px-3 text-base text-gray-900"
            />
          </label>
        </ActionForm>

        {providers.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-gray-200 pt-5">
            {providers.map((provider) => (
              <ActionForm
                key={provider.id}
                action={async () => {
                  "use server";
                  await signIn(provider.id, { redirectTo });
                }}
                submitLabel={`Continuer avec ${provider.name}`}
                variant="secondary"
              />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
