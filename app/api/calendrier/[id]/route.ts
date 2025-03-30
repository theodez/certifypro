import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";

// GET - Récupérer un événement spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const eventId = params.id;
    
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

    // Récupérer l'événement
    const event = await prisma.calendrier.findUnique({
      where: { id: eventId },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        devis: {
          select: {
            id: true,
            montant: true,
            statut: true,
            date_creation: true,
            date_validation: true,
            date_paiement: true
          }
        }
      }
    });

    if (!event) {
      return new NextResponse("Événement non trouvé", { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cet événement
    if (event.entrepriseId !== currentUser.entrepriseId) {
      return new NextResponse("Accès refusé", { status: 403 });
    }


    // Formater l'événement pour l'affichage
    const formattedEvent = {
      id: event.id,
      title: event.titre,
      description: event.description,
      datetime: event.date_heure,
      status: event.statut,
      user: {
        id: event.utilisateur.id,
        name: `${event.utilisateur.prenom} ${event.utilisateur.nom}`,
        email: event.utilisateur.email,
        phone: event.utilisateur.telephone
      },
      quote: event.devis.length > 0 ? {
        id: event.devis[0].id,
        amount: event.devis[0].montant,
        status: event.devis[0].statut,
        createdAt: event.devis[0].date_creation,
        validatedAt: event.devis[0].date_validation,
        paidAt: event.devis[0].date_paiement
      } : null
    };

    return NextResponse.json(formattedEvent);
  } catch (error) {
    console.error("[CALENDRIER_GET_ONE]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

// PUT - Mettre à jour un événement
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const eventId = params.id;
    
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

    // Vérifier que l'événement existe et appartient à cette entreprise
    const existingEvent = await prisma.calendrier.findFirst({
      where: {
        id: eventId,
        entrepriseId: currentUser.entrepriseId
      }
    });

    if (!existingEvent) {
      return new NextResponse("Événement non trouvé", { status: 404 });
    }

    // Seuls les admins et représentants peuvent modifier des événements
    if (![ROLES.ADMIN, ROLES.REPRESENTANT].includes(currentUser.role)) {
      return new NextResponse("Permission refusée", { status: 403 });
    }

    const body = await request.json();
    const { titre, description, date_heure, userId, statut, updateQuote, quoteData } = body;

    // Validation des données
    if (!titre || !date_heure || !userId || !statut) {
      return new NextResponse("Données manquantes", { status: 400 });
    }

    // Si on change l'utilisateur, vérifier qu'il existe et appartient à la même entreprise
    if (userId !== existingEvent.userId) {
      const userExists = await prisma.utilisateur.findFirst({
        where: {
          id: userId,
          entrepriseId: currentUser.entrepriseId
        }
      });

      if (!userExists) {
        return new NextResponse("Utilisateur invalide", { status: 400 });
      }
    }

    // Mettre à jour l'événement avec une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'événement
      const updatedEvent = await tx.calendrier.update({
        where: { id: eventId },
        data: {
          titre,
          description,
          date_heure: new Date(date_heure),
          userId,
          statut
        }
      });

      // Mettre à jour le devis associé si demandé
      if (updateQuote && quoteData) {
        // Vérifier si un devis existe déjà
        const existingQuote = await tx.devis.findFirst({
          where: { rdv_id: eventId }
        });

        if (existingQuote) {
          await tx.devis.update({
            where: { id: existingQuote.id },
            data: {
              montant: parseFloat(quoteData.montant),
              statut: quoteData.statut,
              date_validation: quoteData.statut === "Validé" ? new Date() : existingQuote.date_validation,
              date_paiement: quoteData.statut === "Payé" ? new Date() : existingQuote.date_paiement
            }
          });
        } else if (quoteData.montant) {
          await tx.devis.create({
            data: {
              userId,
              entrepriseId: currentUser.entrepriseId,
              montant: parseFloat(quoteData.montant),
              statut: quoteData.statut || "En attente",
              date_creation: new Date(),
              rdv_id: eventId
            }
          });
        }
      }

      // Créer une notification pour informer de la mise à jour
      await tx.notification.create({
        data: {
          userId,
          type: "RDV",
          message: `Mise à jour du rendez-vous: ${titre} le ${new Date(date_heure).toLocaleDateString()}`,
          data: { eventId: updatedEvent.id }
        }
      });

      return updatedEvent;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CALENDRIER_PUT]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const eventId = params.id;
    
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

    // Vérifier que l'événement existe et appartient à cette entreprise
    const existingEvent = await prisma.calendrier.findFirst({
      where: {
        id: eventId,
        entrepriseId: currentUser.entrepriseId
      },
      include: {
        utilisateur: {
          select: {
            id: true
          }
        },
        devis: true
      }
    });

    if (!existingEvent) {
      return new NextResponse("Événement non trouvé", { status: 404 });
    }

    // Seuls les admins et représentants peuvent supprimer des événements
    if (![ROLES.ADMIN, ROLES.REPRESENTANT].includes(currentUser.role)) {
      return new NextResponse("Permission refusée", { status: 403 });
    }

    // Supprimer l'événement avec une transaction pour gérer les relations
    await prisma.$transaction(async (tx) => {
      // Supprimer les devis associés
      if (existingEvent.devis.length > 0) {
        await tx.devis.deleteMany({
          where: { rdv_id: eventId }
        });
      }

      // Supprimer l'événement
      await tx.calendrier.delete({
        where: { id: eventId }
      });

      // Créer une notification pour informer de la suppression
      await tx.notification.create({
        data: {
          userId: existingEvent.userId,
          type: "RDV",
          message: `Le rendez-vous ${existingEvent.titre} a été annulé`,
          data: { action: "DELETED" }
        }
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CALENDRIER_DELETE]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
} 