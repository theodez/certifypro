"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Si l'utilisateur n'est pas authentifié et que la page a fini de charger
    if (status === "unauthenticated") {
      console.log("Non authentifié, redirection vers login");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  // Afficher un écran de chargement pendant la vérification de la session
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Vérification de votre session...</h2>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié, afficher le contenu
  if (status === "authenticated") {
    return <>{children}</>;
  }

  // Par défaut, afficher un écran de chargement (pendant la redirection)
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
        <h2 className="mt-4 text-xl font-semibold text-gray-700">Redirection...</h2>
      </div>
    </div>
  );
} 