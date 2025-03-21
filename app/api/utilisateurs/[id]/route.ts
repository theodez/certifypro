import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/utilisateurs/:id
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    // First get the user to check the company access
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: { entrepriseId: true }
    });

    if (!utilisateur) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Check user access to this company
    const accessError = await checkAccess(
      request, 
      utilisateur.entrepriseId, 
      ROLES.REPRESENTANT
    );
    if (accessError) return accessError;

    // Get current user to determine access level
    const currentUser = await getSessionUser();
    const isAdmin = currentUser?.role === ROLES.ADMIN;
    
    // Check if the user is requesting their own profile
    const isSelfProfile = currentUser?.id === id;
    
    // Details for admin or self
    const fullUserSelect = {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      telephone: true,
      adresse: true,
      num_securite_sociale: true,
      equipeId: true,
      entrepriseId: true,
      statut_user: true,
      qr_code: true,
      equipe: {
        select: {
          id: true,
          nom: true,
          responsableId: true,
        },
      },
      formations: {
        select: {
          id: true,
          type_formation: true,
          nom: true,
          date_delivrance: true,
          date_expiration: true,
          statut_formation: true,
          organisme: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
        orderBy: {
          date_expiration: "asc",
        },
      },
    };

    // Basic details for other users (représentants who are not viewing their own profile)
    const basicUserSelect = {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      equipeId: true,
      statut_user: true,
      equipe: {
        select: {
          id: true,
          nom: true,
        },
      },
    };

    // Get user details based on access level
    const userDetails = await prisma.utilisateur.findUnique({
      where: { id },
      select: isAdmin || isSelfProfile ? fullUserSelect : basicUserSelect,
    });

    return NextResponse.json(userDetails);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 