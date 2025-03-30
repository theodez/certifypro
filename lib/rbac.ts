import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Supported roles in order of permission level (lowest to highest)
export const ROLES = {
  REPRESENTANT: "representant", // Chef de chantier - accès limité
  ADMIN: "admin",               // Admin, RH - accès complet
  OUVRIER: "ouvrier",
};

// Helper to get current session user
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

// Check if user has access to a company's data
export async function hasCompanyAccess(entrepriseId: string) {
  const user = await getSessionUser();
  
  if (!user) {
    return false;
  }
  
  // User can only access data from their own company
  return user.entrepriseId === entrepriseId;
}

// Check if user has required role or higher
export function hasRequiredRole(userRole: string, requiredRole: string) {
  const roleValues = Object.values(ROLES);
  const userRoleIndex = roleValues.indexOf(userRole);
  const requiredRoleIndex = roleValues.indexOf(requiredRole);
  
  // User role must be equal or higher than required role
  return userRoleIndex >= requiredRoleIndex;
}

// Middleware to check role and company access
export async function checkAccess(
  request: NextRequest,
  entrepriseId: string,
  requiredRole = ROLES.REPRESENTANT
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 }
    );
  }

  // Check company access
  if (user.entrepriseId !== entrepriseId) {
    return NextResponse.json(
      { error: "Accès non autorisé à cette entreprise" },
      { status: 403 }
    );
  }

  // Check role
  if (!hasRequiredRole(user.role, requiredRole)) {
    return NextResponse.json(
      { error: "Rôle insuffisant pour cette action" },
      { status: 403 }
    );
  }

  return null; // No error, access granted
} 