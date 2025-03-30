import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id
export async function GET(request: NextRequest) {
  // Extraction de l'ID de l'entreprise depuis l'URL
  const entrepriseId = request.nextUrl.pathname.split("/").at(-1);

  if (!entrepriseId) {
    return NextResponse.json({ error: "ID entreprise manquant" }, { status: 400 });
  }

  // Vérification des accès (tous les utilisateurs authentifiés ayant accès à l'entreprise peuvent voir les détails)
  const accessError = await checkAccess(request, entrepriseId, ROLES.REPRESENTANT);
  if (accessError) return accessError;

  try {
    // Récupération des données de l'entreprise
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      include: {
        // Nombre d'utilisateurs, équipes, formations, etc. pour les admins
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
      return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });
    }

    return NextResponse.json(entreprise);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
