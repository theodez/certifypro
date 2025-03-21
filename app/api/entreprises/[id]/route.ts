import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  // Check user access (all authenticated users with access to the company can view basic details)
  const accessError = await checkAccess(request, id, ROLES.REPRESENTANT);
  if (accessError) return accessError;

  try {
    // Fetch company data
    const entreprise = await prisma.entreprise.findUnique({
      where: { id },
      include: {
        // Count of users, teams, etc. for admins
        _count: {
          select: {
            utilisateurs: true,
            equipes: true,
            formations: true,
            calendriers: true,
            devis: true,
          },
        },
      },
    });

    if (!entreprise) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
} 