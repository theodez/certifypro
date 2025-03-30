import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";

// GET - Récupérer les événements du calendrier pour l'utilisateur/entreprise
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        id: true,
        entrepriseId: true,
        role: true
      }
    });

    if (!currentUser) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 });
    }

    // Paramètres de filtre (date début, date fin)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // Construire la requête
    let whereClause: any = {
      entrepriseId: currentUser.entrepriseId
    };

    // Filtrer par dates si fournies
    if (startDate && endDate) {
      whereClause.date_heure = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Si on est admin ou representant et qu'on demande les événements d'un utilisateur spécifique
    if ([ROLES.ADMIN, ROLES.REPRESENTANT].includes(currentUser.role) && userId) {
      whereClause.userId = userId;
    } 
    
    // Récupérer les événements
    const events = await prisma.calendrier.findMany({
      where: whereClause,
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        devis: {
          select: {
            id: true,
            montant: true,
            statut: true
          }
        }
      },
      orderBy: {
        date_heure: 'asc'
      }
    });

    // Formater les événements pour l'affichage
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.titre,
      description: event.description,
      datetime: event.date_heure,
      status: event.statut,
      user: {
        id: event.utilisateur.id,
        name: `${event.utilisateur.prenom} ${event.utilisateur.nom}`,
        email: event.utilisateur.email
      },
      hasQuote: event.devis.length > 0,
      quoteStatus: event.devis.length > 0 ? event.devis[0].statut : null,
      quoteAmount: event.devis.length > 0 ? event.devis[0].montant : null
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error("[CALENDRIER_GET]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

// POST - Créer un nouvel événement de calendrier
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    // Récupérer l'utilisateur connecté
    const currentUser = await prisma.utilisateur.findUnique({
      where: { email: session.user.email! },
      select: { 
        id: true,
        entrepriseId: true,
        role: true
      }
    });

    if (!currentUser) {
      return new NextResponse("Utilisateur non trouvé", { status: 404 });
    }

    // Seuls les admins et représentants peuvent créer des événements
    if (![ROLES.ADMIN, ROLES.REPRESENTANT].includes(currentUser.role)) {
      return new NextResponse("Permission refusée", { status: 403 });
    }

    const body = await request.json();
    const { titre, description, date_heure, userId, statut, createDevis, montantDevis } = body;

    // Validation des données
    if (!titre || !date_heure || !userId || !statut) {
      return new NextResponse("Données manquantes", { status: 400 });
    }

    // Vérifier que l'utilisateur existe et appartient à la même entreprise
    const userExists = await prisma.utilisateur.findFirst({
      where: {
        id: userId,
        entrepriseId: currentUser.entrepriseId
      }
    });

    if (!userExists) {
      return new NextResponse("Utilisateur invalide", { status: 400 });
    }

    // Créer l'événement avec une transaction (pour gérer aussi le devis si nécessaire)
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'événement
      const newEvent = await tx.calendrier.create({
        data: {
          titre,
          description,
          date_heure: new Date(date_heure),
          userId,
          entrepriseId: currentUser.entrepriseId,
          statut
        }
      });

      // Créer un devis associé si demandé
      if (createDevis && montantDevis) {
        await tx.devis.create({
          data: {
            userId,
            entrepriseId: currentUser.entrepriseId,
            montant: parseFloat(montantDevis),
            statut: "En attente",
            date_creation: new Date(),
            rdv_id: newEvent.id
          }
        });
      }

      // Créer une notification pour l'utilisateur
      await tx.notification.create({
        data: {
          userId,
          type: "RDV",
          message: `Nouveau rendez-vous: ${titre} le ${new Date(date_heure).toLocaleDateString()}`,
          data: { eventId: newEvent.id }
        }
      });

      return newEvent;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[CALENDRIER_POST]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
} 