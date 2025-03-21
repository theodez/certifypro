import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id/equipes
export async function GET(request: NextRequest) {
  const entrepriseId = request.nextUrl.pathname.split("/").at(-2); // Extraction de l'ID depuis l'URL

  if (!entrepriseId) {
    return NextResponse.json({ error: "ID entreprise manquant" }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;

  // Paramètres optionnels de requête
  const actif = searchParams.get("actif");
  const responsableId = searchParams.get("responsableId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Vérification des droits d'accès
  const accessError = await checkAccess(request, entrepriseId, ROLES.REPRESENTANT);
  if (accessError) return accessError;

  try {
    // Construction des filtres
    const where: any = { entrepriseId };
    if (actif !== null) where.actif = actif === "true";
    if (responsableId) where.responsableId = responsableId;

    // Récupération des équipes avec pagination
    const equipes = await prisma.equipe.findMany({
      where,
      include: {
        responsable: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        _count: {
          select: {
            utilisateurs: true,
          },
        },
      },
      orderBy: { nom: "asc" },
      skip,
      take: limit,
    });

    // Récupération du total pour la pagination
    const total = await prisma.equipe.count({ where });

    return NextResponse.json({
      equipes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
