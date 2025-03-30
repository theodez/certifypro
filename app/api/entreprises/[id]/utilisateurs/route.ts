import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkAccess, ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/entreprises/:id/utilisateurs
export async function GET(request: NextRequest) {
  // Extraction de l'ID de l'entreprise depuis l'URL
  const entrepriseId = request.nextUrl.pathname.split("/").at(-2);

  if (!entrepriseId) {
    return NextResponse.json({ error: "ID entreprise manquant" }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;

  // Paramètres optionnels
  const role = searchParams.get("role");
  const equipeId = searchParams.get("equipeId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Vérification des accès
  const accessError = await checkAccess(request, entrepriseId, ROLES.REPRESENTANT);
  if (accessError) return accessError;

  // Récupération de l'utilisateur pour déterminer le niveau de détails affiché
  const user = await getSessionUser();
  const isAdmin = user?.role === ROLES.ADMIN;

  try {
    // Construction des filtres
    const where: any = { entrepriseId };
    if (role) where.role = role;
    if (equipeId) where.equipeId = equipeId;

    // Récupération des utilisateurs avec pagination
    const utilisateurs = await prisma.utilisateur.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        equipeId: true,
        statut_user: true,
        // Inclusion des données sensibles uniquement pour les admins
        ...(isAdmin
          ? {
              telephone: true,
              adresse: true,
              num_securite_sociale: true,
            }
          : {}),
        // Inclusion des informations de l'équipe associée
        equipe: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: { nom: "asc" },
      skip,
      take: limit,
    });

    // Récupération du nombre total d'utilisateurs pour la pagination
    const total = await prisma.utilisateur.count({ where });

    return NextResponse.json({
      utilisateurs,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
