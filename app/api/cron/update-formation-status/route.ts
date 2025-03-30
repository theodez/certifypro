import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { addMonths, isAfter, isBefore, startOfDay, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const notifications = [];

    // Récupérer toutes les formations avec leurs dates d'expiration et les utilisateurs associés
    const formations = await prisma.formation.findMany({
      where: {
        date_expiration: {
          not: null
        }
      },
      include: {
        utilisateur: {
          select: {
            email: true,
            nom: true,
            prenom: true,
            equipeId: true
          }
        }
      }
    });

    for (const formation of formations) {
      if (!formation.date_expiration) continue;

      const expirationDate = new Date(formation.date_expiration);
      const oneMonthBefore = addMonths(expirationDate, -1);
      const formattedExpirationDate = format(expirationDate, 'dd MMMM yyyy', { locale: fr });

      // Vérifier si la formation expire bientôt ou est expirée
      if (isAfter(today, expirationDate)) {
        // Formation expirée
        notifications.push(
          prisma.notification.create({
            data: {
              userId: formation.userId,
              formationId: formation.id,
              type: "FORMATION",
              message: `Votre formation "${formation.nom}" est expirée depuis le ${formattedExpirationDate}`,
              data: {
                formationId: formation.id,
                expirationDate: formation.date_expiration,
                type: "expired"
              }
            }
          })
        );

        // Si l'utilisateur fait partie d'une équipe, notifier aussi le responsable
        if (formation.utilisateur.equipeId) {
          const equipe = await prisma.equipe.findUnique({
            where: { id: formation.utilisateur.equipeId },
            select: { responsableId: true }
          });

          if (equipe?.responsableId) {
            notifications.push(
              prisma.notification.create({
                data: {
                  userId: equipe.responsableId,
                  formationId: formation.id,
                  type: "FORMATION",
                  message: `La formation "${formation.nom}" de ${formation.utilisateur.prenom} ${formation.utilisateur.nom} est expirée depuis le ${formattedExpirationDate}`,
                  data: {
                    formationId: formation.id,
                    expirationDate: formation.date_expiration,
                    type: "expired",
                    employeeId: formation.userId
                  }
                }
              })
            );
          }
        }
      } 
      else if (isAfter(today, oneMonthBefore) && isBefore(today, expirationDate)) {
        // Formation qui expire dans moins d'un mois
        notifications.push(
          prisma.notification.create({
            data: {
              userId: formation.userId,
              formationId: formation.id,
              type: "FORMATION",
              message: `Votre formation "${formation.nom}" expire le ${formattedExpirationDate}`,
              data: {
                formationId: formation.id,
                expirationDate: formation.date_expiration,
                type: "expiring_soon"
              }
            }
          })
        );

        // Si l'utilisateur fait partie d'une équipe, notifier aussi le responsable
        if (formation.utilisateur.equipeId) {
          const equipe = await prisma.equipe.findUnique({
            where: { id: formation.utilisateur.equipeId },
            select: { responsableId: true }
          });

          if (equipe?.responsableId) {
            notifications.push(
              prisma.notification.create({
                data: {
                  userId: equipe.responsableId,
                  formationId: formation.id,
                  type: "FORMATION",
                  message: `La formation "${formation.nom}" de ${formation.utilisateur.prenom} ${formation.utilisateur.nom} expire le ${formattedExpirationDate}`,
                  data: {
                    formationId: formation.id,
                    expirationDate: formation.date_expiration,
                    type: "expiring_soon",
                    employeeId: formation.userId
                  }
                }
              })
            );
          }
        }
      }
    }

    // Créer toutes les notifications en une seule transaction
    if (notifications.length > 0) {
      await prisma.$transaction(notifications);
    }

    return NextResponse.json({
      success: true,
      message: `Vérification terminée. ${notifications.length} notifications créées.`
    });

  } catch (error) {
    console.error('Erreur lors de la vérification des formations:', error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des formations" },
      { status: 500 }
    );
  }
} 