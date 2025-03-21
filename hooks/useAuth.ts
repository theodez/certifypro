import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth({ required = true, redirectTo = '/login' } = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const loading = status === 'loading';
  const loggedIn = status === 'authenticated';
  const user = session?.user;

  useEffect(() => {
    // Si l'authentification est requise et l'utilisateur n'est pas connecté
    if (required && status === 'unauthenticated') {
      console.log('[useAuth] Utilisateur non authentifié, redirection vers', redirectTo);
      // Construire l'URL de redirection avec le callback
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [required, status, router, pathname, redirectTo]);

  return { user, loading, loggedIn };
} 