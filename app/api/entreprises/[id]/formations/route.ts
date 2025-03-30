import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES } from "@/lib/rbac";

// GET /api/entreprises/:id/formations
export async function GET(request: NextRequest) {
  // Extraction de l'ID de l'entreprise depuis l'URL
  const entrepriseId = request.nextUrl.pathname.split("/").at(-2);

  if (!entrepriseId) {
    return NextResponse.json({ error: "ID entreprise manquant" }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;

  // Extraction des paramètres optionnels
  const type = searchParams.get("type");
  const userId = searchParams.get("userId");
  const obligatoire = searchParams.get("obligatoire");
  const status = searchParams.get("statut");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Vérification des accès
  const accessError = await checkAccess(request, entrepriseId, ROLES.ADMIN);
  if (accessError) return accessError;

  try {
    // Construction des filtres
    const where: any = { entrepriseId };
    if (type) where.type_formation = type;
    if (userId) where.userId = userId;
    if (obligatoire !== null) where.obligatoire = obligatoire === "true";
    if (status) where.statut_formation = status;

    // Récupération des formations
    const formations = await prisma.formation.findMany({
      where,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            equipeId: true,
            equipe: { select: { id: true, nom: true } },
          },
        },
        organisme: { select: { id: true, nom: true } },
      },
      orderBy: [
        { date_expiration: "asc" },
        { utilisateur: { nom: "asc" } },
      ],
      skip,
      take: limit,
    });

    // Récupération du nombre total de formations pour la pagination
    const total = await prisma.formation.count({ where });

    return NextResponse.json({
      formations,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des formations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
