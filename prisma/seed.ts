import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Nettoyer la base de données (optionnel, à utiliser avec précaution)
    console.log('Nettoyage de la base de données...');
    await prisma.$transaction([
      prisma.notification.deleteMany({}),
      prisma.devis.deleteMany({}),
      prisma.calendrier.deleteMany({}),
      prisma.formation.deleteMany({}),
      prisma.utilisateur.deleteMany({}),
      prisma.equipe.deleteMany({}),
      prisma.organismeFormation.deleteMany({}),
      prisma.entreprise.deleteMany({}),
    ]);
    
    console.log('Création des données de test...');
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Créer des entreprises
    const entreprise1 = await prisma.entreprise.create({
      data: {
        nom: 'BTP Construction',
        adresse: '123 Avenue des Bâtisseurs, 75001 Paris',
        telephone: '01 23 45 67 89',
        email: 'contact@btpconstruction.fr',
      },
    });
    
    const entreprise2 = await prisma.entreprise.create({
      data: {
        nom: 'Échafaudages Pro',
        adresse: '45 Rue des Échafaudeurs, 69002 Lyon',
        telephone: '04 56 78 90 12',
        email: 'info@echafaudagespro.fr',
      },
    });
    
    // Créer des organismes de formation
    const organisme1 = await prisma.organismeFormation.create({
      data: {
        nom: 'FormaPro BTP',
        adresse: '78 Boulevard de la Formation, 75008 Paris',
        telephone: '01 87 65 43 21',
        email: 'contact@formaprobtp.fr',
      },
    });
    
    const organisme2 = await prisma.organismeFormation.create({
      data: {
        nom: 'Sécurité & Compétences',
        adresse: '12 Rue de la Sécurité, 33000 Bordeaux',
        telephone: '05 67 89 01 23',
        email: 'info@securitecompetences.fr',
      },
    });
    
    // Créer des équipes
    const equipe1 = await prisma.equipe.create({
      data: {
        nom: 'Équipe Montage',
        entrepriseId: entreprise1.id,
        adresse: 'Chantier Paris Nord',
        actif: true,
        code: 'EQ-MONT-01',
        statut_team: 'A jour',
      },
    });

    const equipe2 = await prisma.equipe.create({
      data: {
        nom: 'Équipe Maintenance',
        entrepriseId: entreprise1.id,
        adresse: 'Chantier Paris Sud',
        actif: true,
        code: 'EQ-MAINT-01',
        statut_team: 'Recyclage requis',
      },
    });
    
    // Créer des utilisateurs
    const admin = await prisma.utilisateur.create({
      data: {
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '06 12 34 56 78',
        email: 'admin@btpconstruction.fr',
        role: 'admin',
        entrepriseId: entreprise1.id,
        adresse: '15 Rue des Administrateurs, 75001 Paris',
        statut_user: 'A jour',
        password: hashedPassword,
      },
    });

    const chefChantier1 = await prisma.utilisateur.create({
      data: {
        nom: 'Martin',
        prenom: 'Sophie',
        telephone: '06 23 45 67 89',
        email: 'sophie.martin@btpconstruction.fr',
        role: 'representant',
        entrepriseId: entreprise1.id,
        equipeId: equipe1.id,
        adresse: '27 Avenue des Responsables, 75002 Paris',
        statut_user: 'A jour',
        password: hashedPassword,
      },
    });
    
    // Mettre à jour l'équipe avec le responsable
    await prisma.equipe.update({
      where: { id: equipe1.id },
      data: { responsableId: chefChantier1.id },
    });
    
    const chefChantier2 = await prisma.utilisateur.create({
      data: {
        nom: 'Dubois',
        prenom: 'Pierre',
        telephone: '06 34 56 78 90',
        email: 'pierre.dubois@btpconstruction.fr',
        role: 'representant',
        num_securite_sociale: '1 85 12 75 108 157 42',
        entrepriseId: entreprise1.id,
        equipeId: equipe2.id,
        adresse: '42 Rue des Chefs de Chantier, 75003 Paris',
        statut_user: 'A jour',
        password: hashedPassword,
      },
    });
    
    // Mettre à jour l'équipe 2 avec le responsable
    await prisma.equipe.update({
      where: { id: equipe2.id },
      data: { responsableId: chefChantier2.id },
    });
    
    const admin2 = await prisma.utilisateur.create({
      data: {
        nom: 'Leroy',
        prenom: 'Marie',
        telephone: '06 45 67 89 01',
        email: 'marie.leroy@btpconstruction.fr',
        role: 'admin',
        num_securite_sociale: '2 75 11 75 108 243 15',
        entrepriseId: entreprise1.id,
        adresse: '18 Boulevard des Administrateurs, 75004 Paris',
        statut_user: 'A jour',
        password: hashedPassword,
      },
    });

    // Créer des formations
    const formation1 = await prisma.formation.create({
      data: {
        type_formation: 'Montage échafaudage',
        nom: 'Certification Montage Échafaudage Niveau 1',
        description: 'Formation aux techniques de montage d\'échafaudages fixes',
        date_delivrance: new Date('2023-01-15'),
        date_expiration: new Date('2025-01-15'),
        validite: 24, // 24 mois
        organismeId: organisme1.id,
        userId: chefChantier1.id,
        entrepriseId: entreprise1.id,
        obligatoire: true,
        statut_formation: 'Valide',
      },
    });
    
    const formation2 = await prisma.formation.create({
      data: {
        type_formation: 'CACES R486',
        nom: 'CACES R486 Catégorie B',
        description: 'Certificat d\'aptitude à la conduite en sécurité pour nacelles',
        date_delivrance: new Date('2022-06-10'),
        date_expiration: new Date('2022-12-10'), // Déjà expiré
        validite: 60, // 60 mois
        organismeId: organisme2.id,
        userId: chefChantier2.id,
        entrepriseId: entreprise1.id,
        obligatoire: true,
        statut_formation: 'Expirée',
      },
    });
    
    // Créer des rendez-vous dans le calendrier
    const calendrier1 = await prisma.calendrier.create({
      data: {
        titre: 'Recyclage CACES R486',
        description: 'Session de recyclage pour le CACES R486 Catégorie B',
        date_heure: new Date('2023-03-25T09:00:00Z'),
        userId: chefChantier2.id,
        entrepriseId: entreprise1.id,
        statut: 'Planifié',
      },
    });
    
    const calendrier2 = await prisma.calendrier.create({
      data: {
        titre: 'Visite médicale annuelle',
        description: 'Visite médicale obligatoire',
        date_heure: new Date('2023-04-10T14:30:00Z'),
        userId: chefChantier1.id,
        entrepriseId: entreprise1.id,
        statut: 'Planifié',
      },
    });
    
    // Créer des devis
    const devis1 = await prisma.devis.create({
      data: {
        userId: admin.id,
        entrepriseId: entreprise1.id,
        montant: 450.00,
        statut: 'En attente',
        date_creation: new Date(),
        rdv_id: calendrier1.id,
      },
    });
    
    // Créer des notifications
    const notification1 = await prisma.notification.create({
      data: {
        userId: chefChantier2.id,
        formationId: formation2.id,
        type: 'FORMATION',
        message: 'Votre certification CACES R486 a expiré. Veuillez planifier un recyclage.',
        isRead: false,
        createdAt: new Date(),
      },
    });
    
    const notification2 = await prisma.notification.create({
      data: {
        userId: chefChantier1.id,
        type: 'RDV',
        message: 'Rappel: Visite médicale prévue le 10 avril à 14h30.',
        isRead: false,
        createdAt: new Date(),
      },
    });
    
    console.log('Base de données initialisée avec succès !');
    console.log('Données créées :');
    console.log({
      entreprises: [entreprise1.nom, entreprise2.nom],
      organismes: [organisme1.nom, organisme2.nom],
      equipes: [equipe1.nom, equipe2.nom],
      utilisateurs: [
        `${admin.prenom} ${admin.nom} (${admin.role})`,
        `${chefChantier1.prenom} ${chefChantier1.nom} (${chefChantier1.role})`,
        `${chefChantier2.prenom} ${chefChantier2.nom} (${chefChantier2.role})`,
        `${admin2.prenom} ${admin2.nom} (${admin2.role})`,
      ],
      formations: [formation1.nom, formation2.nom],
      calendriers: [calendrier1.titre, calendrier2.titre],
      devis: [`Devis #${devis1.id} - ${devis1.montant}€`],
      notifications: [notification1.message, notification2.message],
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 