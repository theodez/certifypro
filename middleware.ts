import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Définir les routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ['/', '/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Si la route est publique, laisser passer
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Récupérer le token pour vérifier l'authentification et le rôle
  const token = await getToken({ req: request });
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
  if (!token) {
    console.log(`[Middleware] Tentative d'accès à une route protégée (${pathname}) sans être connecté`);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', encodeURI(request.url));
    return NextResponse.redirect(loginUrl);
  }

  // Vérifier que l'utilisateur a un rôle valide (admin ou représentant)
  const role = token.role as string;
  if (role !== 'admin' && role !== 'representant') {
    console.log(`[Middleware] Utilisateur avec rôle invalide (${role}) tente d'accéder à ${pathname}`);
    // Rediriger vers une page d'accès refusé
    return NextResponse.redirect(new URL('/acces-refuse', request.url));
  }

  // Si l'utilisateur est sur la page de login mais qu'il est déjà connecté,
  // rediriger vers le dashboard
  if (pathname === '/login' && token) {
    console.log('[Middleware] Utilisateur déjà connecté, redirection vers le dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Configurer les routes sur lesquelles le middleware doit s'exécuter
export const config = {
  matcher: [
    /*
     * Match toutes les routes suivantes:
     * - /login (pour rediriger si déjà connecté)
     * - /dashboard et ses sous-routes (routes privées)
     * - /api et ses sous-routes (sauf /api/auth)
     * - Exclure les assets statiques
     */
    '/login',
    '/dashboard/:path*',
    '/api/:path*',
  ],
}; 