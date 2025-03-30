import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ROLES, getSessionUser } from "@/lib/rbac";

// GET /api/equipes/:id
export async function GET(request: NextRequest) {
  try {
    const equipeId = request.nextUrl.pathname.split("/").at(-1);

    if (!equipeId) {
      return NextResponse.json(
        { error: "ID équipe manquant dans l'URL" },
        { status: 400 }
      );
    }

    // 1. Vérifier que l'équipe existe et récupérer son entreprise
    const equipe = await prisma.equipe.findUnique({
      where: { id: equipeId },
      select: {
        entrepriseId: true,
        membres: { select: { id: true } },
        responsables: { select: { id: true } },
      },
    });

    if (!equipe) {
      return NextResponse.json(
        { error: `Équipe avec ID ${equipeId} non trouvée` },
        { status: 404 }
      );
    }

    // 2. Récupérer l'utilisateur courant
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié - connexion requise" },
        { status: 401 }
      );
    }

    // 3. Vérifier les accès selon plusieurs critères
    const canAccess =
      // Admin de l'entreprise
      user.role === ROLES.ADMIN ||
      // Représentant de l'entreprise
      user.role === ROLES.REPRESENTANT ||
      // Membre de l'équipe
      equipe.membres.some((m) => m.id === user.id) ||
      // Responsable de l'équipe
      equipe.responsables.some((r) => r.id === user.id);

    if (!canAccess) {
      return NextResponse.json(
        {
          error: `Accès refusé - vous n'avez pas les permissions nécessaires pour accéder à cette équipe`,
          details: {
            userId: user.id,
            userRole: user.role,
            equipeId,
            entrepriseId: equipe.entrepriseId,
          },
        },
        { status: 403 }
      );
    }

    // 4. Récupérer les détails complets de l'équipe
    const equipeDetails = await prisma.equipe.findUnique({
      where: { id: equipeId },
      include: {
        entreprise: {
          select: {
            id: true,
            nom: true,
          },
        },
        responsables: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            telephone: true,
          },
        },
        membres: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            telephone: true,
            formations: {
              where: {
                date_expiration: { gte: new Date() }, // Seulement formations valides
              },
              select: {
                id: true,
                nom: true,
                date_expiration: true,
              },
            },
          },
          orderBy: { nom: "asc" },
        },
      },
    });

    if (!equipeDetails) {
      return NextResponse.json(
        { error: `Erreur lors de la récupération des détails de l'équipe ${equipeId}` },
        { status: 500 }
      );
    }

    return NextResponse.json(equipeDetails);
  } catch (error) {
    console.error("Erreur GET /api/equipes/:id", error);
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération de l'équipe",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// PUT /api/equipes/:id
export async function PUT(request: NextRequest) {
  console.log('===== DÉBUT PUT /api/equipes/:id =====');
  
  try {
    // 1. Extraire l'ID de l'équipe de l'URL
    const equipeId = request.nextUrl.pathname.split("/").at(-1);
    console.log('[1] ID équipe extrait:', equipeId);

    if (!equipeId) {
      console.log('[ERREUR] ID équipe manquant dans l\'URL');
      return NextResponse.json(
        { error: "ID équipe manquant dans l'URL" },
        { status: 400 }
      );
    }

    // 2. Récupérer la session utilisateur
    console.log('[2] Récupération de la session utilisateur...');
    const user = await getSessionUser();
    
    if (!user) {
      console.log('[ERREUR] Aucun utilisateur connecté');
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }
    
    console.log('[2] Utilisateur connecté:', {
      id: user.id,
      email: user.email,
      role: user.role,
      entrepriseId: user.entrepriseId
    });

    // 3. Récupérer les données reçues dans le corps de la requête
    console.log('[3] Récupération des données du corps de la requête...');
    const rawData = await request.text();
    console.log('[3] Données brutes reçues:', rawData);
    
    let data;
    try {
      data = JSON.parse(rawData);
      console.log('[3] Données parsées:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('[ERREUR] Échec du parsing JSON:', error);
      return NextResponse.json(
        { error: "Format JSON invalide dans le corps de la requête" },
        { status: 400 }
      );
    }

    // 4. Vérifier que l'équipe existe
    console.log('[4] Recherche de l\'équipe dans la base de données...');
    const equipe = await prisma.equipe.findUnique({
      where: { id: equipeId },
      select: {
        id: true,
        nom: true,
        entrepriseId: true,
        responsables: { 
          select: { 
            id: true,
            nom: true,
            prenom: true
          } 
        },
      },
    });

    if (!equipe) {
      console.log('[ERREUR] Équipe non trouvée avec ID:', equipeId);
      return NextResponse.json(
        { error: `Équipe avec ID ${equipeId} non trouvée` },
        { status: 404 }
      );
    }

    console.log('[4] Équipe trouvée:', {
      id: equipe.id,
      nom: equipe.nom,
      entrepriseId: equipe.entrepriseId,
      responsables: equipe.responsables.map(r => `${r.prenom} ${r.nom} (${r.id})`)
    });

    // 5. Vérifier si l'entreprise de l'équipe correspond à celle de l'utilisateur
    console.log('[5] Vérification de l\'appartenance à la même entreprise...');
    console.log(`   - ID entreprise de l'équipe: "${equipe.entrepriseId}"`);
    console.log(`   - ID entreprise de l'utilisateur: "${user.entrepriseId}"`);
    
    if (user.entrepriseId !== equipe.entrepriseId) {
      console.log('[ERREUR] L\'utilisateur n\'appartient pas à la même entreprise que l\'équipe');
      return NextResponse.json(
        {
          error: "Accès refusé - Vous n'appartenez pas à la même entreprise que cette équipe",
          details: {
            userEntrepriseId: user.entrepriseId,
            equipeEntrepriseId: equipe.entrepriseId,
          }
        },
        { status: 403 }
      );
    }
    
    console.log('[5] Vérification d\'entreprise OK');

    // 6. Vérifier les droits de l'utilisateur
    console.log('[6] Vérification des droits utilisateur...');
    const isAdmin = user.role === ROLES.ADMIN;
    const isResponsable = equipe.responsables.some(r => r.id === user.id);
    
    console.log(`   - Est admin: ${isAdmin}`);
    console.log(`   - Est responsable de l'équipe: ${isResponsable}`);

    if (!isAdmin && !isResponsable) {
      console.log('[ERREUR] Droits insuffisants pour modifier l\'équipe');
      return NextResponse.json(
        {
          error: "Accès refusé - vous devez être admin ou responsable de l'équipe pour la modifier",
        },
        { status: 403 }
      );
    }

    console.log('[6] Vérification des droits OK');

    // 7. Validation des données
    console.log('[7] Validation des données...');
    const validationErrors = [];
    
    if (!data.nom || data.nom.trim().length < 2) {
      validationErrors.push("Le nom de l'équipe doit contenir au moins 2 caractères");
    }

    if (typeof data.actif !== "boolean") {
      validationErrors.push("Le statut actif doit être un booléen (true/false)");
    }
    
    if (data.membresIds && !Array.isArray(data.membresIds)) {
      validationErrors.push("membresIds doit être un tableau d'IDs");
    }

    if (data.responsablesIds && !Array.isArray(data.responsablesIds)) {
      validationErrors.push("responsablesIds doit être un tableau d'IDs");
    }
    
    if (validationErrors.length > 0) {
      console.log('[ERREUR] Validation échouée:', validationErrors);
      return NextResponse.json(
        {
          error: "Validation échouée",
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    console.log('[7] Validation des données OK');

    // 8. Préparation des données pour la mise à jour
    console.log('[8] Préparation des données pour mise à jour...');
      const updateData: any = {
        nom: data.nom,
        actif: data.actif,
      };

    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    
    console.log('[8] Structure de mise à jour de base:', updateData);

    // 9. Vérification et préparation des responsables
    if (data.responsablesIds && data.responsablesIds.length > 0) {
      console.log('[9] Vérification des responsables:', data.responsablesIds);
      
        const existingResponsables = await prisma.utilisateur.findMany({
        where: { 
          id: { in: data.responsablesIds },
          entrepriseId: equipe.entrepriseId
        },
        select: { 
          id: true,
          nom: true,
          prenom: true
        },
      });
      
      console.log(`[9] Responsables trouvés: ${existingResponsables.length}/${data.responsablesIds.length}`);

        if (existingResponsables.length !== data.responsablesIds.length) {
        const existingIds = existingResponsables.map(r => r.id);
        const missingIds = data.responsablesIds.filter((id: string) => !existingIds.includes(id));
        
        console.log('[ERREUR] Certains responsables n\'existent pas:', missingIds);
        return NextResponse.json(
          {
            error: "Certains responsables n'existent pas ou n'appartiennent pas à cette entreprise",
            details: missingIds,
          },
          { status: 400 }
          );
        }

        updateData.responsables = {
          set: data.responsablesIds.map((id: string) => ({ id })),
        };
      
      console.log('[9] Responsables validés et préparés pour la mise à jour');
    }

    // 10. Vérification et préparation des membres
    if (data.membresIds && data.membresIds.length > 0) {
      console.log('[10] Vérification des membres:', data.membresIds);
      
        const existingMembres = await prisma.utilisateur.findMany({
        where: { 
          id: { in: data.membresIds },
          entrepriseId: equipe.entrepriseId
        },
        select: { 
          id: true,
          nom: true,
          prenom: true
        },
      });
      
      console.log(`[10] Membres trouvés: ${existingMembres.length}/${data.membresIds.length}`);

        if (existingMembres.length !== data.membresIds.length) {
        const existingIds = existingMembres.map(m => m.id);
        const missingIds = data.membresIds.filter((id: string) => !existingIds.includes(id));
        
        console.log('[ERREUR] Certains membres n\'existent pas:', missingIds);
        return NextResponse.json(
          {
            error: "Certains membres n'existent pas ou n'appartiennent pas à cette entreprise",
            details: missingIds,
          },
          { status: 400 }
          );
        }

        updateData.membres = {
          set: data.membresIds.map((id: string) => ({ id })),
        };
      
      console.log('[10] Membres validés et préparés pour la mise à jour');
    }

    // 11. Exécution de la mise à jour
    console.log('[11] Exécution de la mise à jour avec:', JSON.stringify(updateData, null, 2));
    
    const updatedEquipe = await prisma.equipe.update({
        where: { id: equipeId },
        data: updateData,
        include: {
        entreprise: {
          select: {
            id: true,
            nom: true,
          },
        },
          responsables: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
              telephone: true,
          },
          },
          membres: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true,
              telephone: true,
              formations: {
                select: {
                  id: true,
                  type_formation: true,
                  nom: true,
                  date_expiration: true,
                  date_delivrance: true,
                  obligatoire: true,
                },
              },
            },
            orderBy: { nom: "asc" },
          },
        },
      });
    
    console.log('[11] Mise à jour réussie, ID:', updatedEquipe.id);
    console.log('===== FIN PUT /api/equipes/:id - SUCCÈS =====');

    return NextResponse.json(updatedEquipe);
  } catch (error) {
    console.error('===== ERREUR PUT /api/equipes/:id =====');
    console.error('Message:', error instanceof Error ? error.message : 'Erreur inconnue');
    console.error('Stack:', error instanceof Error ? error.stack : 'Non disponible');
    
    const status = error instanceof Error && 
                   error.message.includes("Prisma") ? 500 : 400;

    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour de l'équipe",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status }
    );
  }
}