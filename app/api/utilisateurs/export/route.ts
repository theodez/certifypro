import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getFormationStatus } from "@/lib/utils/formation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupérer l'utilisateur connecté pour obtenir son entrepriseId
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { entrepriseId: true }
    });

    if (!currentUser) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 });
    }

    // Récupérer tous les utilisateurs de l'entreprise avec leurs relations
    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        entrepriseId: currentUser.entrepriseId
      },
      include: {
        formations: {
          select: {
            date_expiration: true,
            type_formation: true
          }
        },
        equipe: {
          select: {
            nom: true
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Créer l'en-tête du CSV
    const csvHeader = [
      'Nom',
      'Prénom',
      'Email',
      'Rôle',
      'Équipe',
      'Formations valides',
      'Formations à renouveler',
      'Formations expirées'
    ].join(',');

    // Créer les lignes du CSV
    const csvRows = utilisateurs.map(user => {
      const formations = user.formations || [];
      const validCount = formations.filter(f => getFormationStatus(f.date_expiration) === "Valide").length;
      const warningCount = formations.filter(f => getFormationStatus(f.date_expiration) === "À renouveler").length;
      const expiredCount = formations.filter(f => getFormationStatus(f.date_expiration) === "Expirée").length;

      return [
        user.nom,
        user.prenom,
        user.email,
        user.role,
        user.equipe?.nom || "Sans équipe",
        validCount,
        warningCount,
        expiredCount
      ].map(field => `"${field}"`).join(',');
    });

    // Combiner l'en-tête et les lignes
    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Créer la réponse avec le bon type de contenu
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="employes.csv"'
      }
    });
  } catch (error) {
    console.error("[UTILISATEURS_EXPORT]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
} 