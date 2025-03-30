import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Nettoyer la base de données existante
  await prisma.notification.deleteMany();
  await prisma.devis.deleteMany();
  await prisma.calendrier.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.organismeFormation.deleteMany();
  await prisma.equipe.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.entreprise.deleteMany();

  // Créer des entreprises
  const entreprise1 = await prisma.entreprise.create({
    data: {
      nom: 'BTP Construct',
      adresse: '12 Rue des Entrepreneurs, 75000 Paris',
      telephone: '0123456789',
      email: 'contact@btpconstruct.fr',
    },
  });

  const entreprise2 = await prisma.entreprise.create({
    data: {
      nom: 'Echafaudage Pro',
      adresse: '34 Avenue du Travail, 69000 Lyon',
      telephone: '0456789123',
      email: 'contact@echafaudagepro.com',
    },
  });

  // Créer des organismes de formation
  const organisme1 = await prisma.organismeFormation.create({
    data: {
      nom: 'Formation BTP Expert',
      telephone: '0898765432',
      email: 'formation@btpexpert.com',
      adresse: '56 Boulevard des Formateurs, 13000 Marseille',
    },
  });

  const organisme2 = await prisma.organismeFormation.create({
    data: {
      nom: 'Sécurité Academy',
      telephone: '0321654987',
      email: 'contact@securite-academy.fr',
      adresse: '78 Rue de la Prévention, 31000 Toulouse',
    },
  });

  // Hasher les mots de passe avec Argon2
  const password = await argon2.hash('Password123!');

  // Créer des utilisateurs (sans équipe pour l'instant)
  const admin1 = await prisma.utilisateur.create({
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      telephone: '0678912345',
      email: 'j.dupont@btpconstruct.fr',
      role: 'admin',
      num_securite_sociale: '1234567890123',
      entrepriseId: entreprise1.id,
      adresse: '1 Rue de la Paix, 75000 Paris',
      password,
    },
  });

  const responsable1 = await prisma.utilisateur.create({
    data: {
      nom: 'Martin',
      prenom: 'Luc',
      telephone: '0678912346',
      email: 'l.martin@btpconstruct.fr',
      role: 'responsable',
      num_securite_sociale: '1234567890124',
      entrepriseId: entreprise1.id,
      adresse: '2 Rue de la Paix, 75000 Paris',
      password,
    },
  });

  const ouvrier1 = await prisma.utilisateur.create({
    data: {
      nom: 'Bernard',
      prenom: 'Pierre',
      telephone: '0678912347',
      email: 'p.bernard@btpconstruct.fr',
      role: 'ouvrier',
      num_securite_sociale: '1234567890125',
      entrepriseId: entreprise1.id,
      adresse: '3 Rue de la Paix, 75000 Paris',
      password,
    },
  });

  const ouvrier2 = await prisma.utilisateur.create({
    data: {
      nom: 'Petit',
      prenom: 'Jacques',
      telephone: '0678912348',
      email: 'j.petit@btpconstruct.fr',
      role: 'ouvrier',
      num_securite_sociale: '1234567890126',
      entrepriseId: entreprise1.id,
      adresse: '4 Rue de la Paix, 75000 Paris',
      password,
    },
  });

  const admin2 = await prisma.utilisateur.create({
    data: {
      nom: 'Leroy',
      prenom: 'Sophie',
      telephone: '0678912355',
      email: 's.leroy@echafaudagepro.com',
      role: 'admin',
      num_securite_sociale: '1234567890133',
      entrepriseId: entreprise2.id,
      adresse: '10 Rue de Lyon, 69000 Lyon',
      password,
    },
  });

  // Créer des équipes avec les nouvelles relations
  const equipe1 = await prisma.equipe.create({
    data: {
      nom: 'Équipe Montage Nord',
      entrepriseId: entreprise1.id,
      adresse: 'Chantier Tour Eiffel, 75000 Paris',
      actif: true,
      code: 'EQMN2023',
      qr_code: 'QR_EQUIPE_001',
      membres: {
        connect: [{ id: ouvrier1.id }, { id: ouvrier2.id }]
      },
      responsables: {
        connect: [{ id: responsable1.id }, { id: admin1.id }] // Responsable + admin comme responsables
      }
    },
  });

  const equipe2 = await prisma.equipe.create({
    data: {
      nom: 'Équipe Sud',
      entrepriseId: entreprise2.id,
      adresse: 'Chantier Part-Dieu, 69000 Lyon',
      actif: true,
      code: 'EQS2023',
      qr_code: 'QR_EQUIPE_002',
      membres: {
        create: {
          nom: 'Moreau',
          prenom: 'Thomas',
          telephone: '0678912356',
          email: 't.moreau@echafaudagepro.com',
          role: 'ouvrier',
          num_securite_sociale: '1234567890134',
          entrepriseId: entreprise2.id,
          adresse: '11 Rue de Lyon, 69000 Lyon',
          password,
        }
      },
      responsables: {
        connect: { id: admin2.id }
      }
    },
  });

  // Ajouter un ouvrier à plusieurs équipes
  await prisma.equipe.update({
    where: { id: equipe2.id },
    data: {
      membres: {
        connect: { id: ouvrier1.id } // ouvrier1 fait maintenant partie de equipe1 et equipe2
      }
    }
  });

  // Créer des formations
  const formation1 = await prisma.formation.create({
    data: {
      type_formation: 'Montage échafaudage',
      nom: 'Formation initiale montage échafaudage',
      description: 'Formation obligatoire pour tous les nouveaux monteurs',
      date_expiration: new Date('2025-12-31'),
      validite: 24,
      organismeId: organisme1.id,
      userId: ouvrier1.id,
      entrepriseId: entreprise1.id,
      date_delivrance: new Date('2023-01-15'),
      obligatoire: true,
    },
  });

  const formation2 = await prisma.formation.create({
    data: {
      type_formation: 'Sécurité en hauteur',
      nom: 'Formation sécurité travaux en hauteur',
      description: 'Rappel annuel des procédures de sécurité',
      date_expiration: new Date('2024-06-30'),
      validite: 12,
      organismeId: organisme2.id,
      userId: responsable1.id,
      entrepriseId: entreprise1.id,
      date_delivrance: new Date('2023-06-15'),
      obligatoire: true,
      pdf_formation: '/uploads/formations/certificat_securite_123.pdf',
    },
  });

  const formation3 = await prisma.formation.create({
    data: {
      type_formation: 'Gestes et postures',
      nom: 'Formation gestes et postures',
      description: 'Prévention des TMS',
      date_expiration: new Date('2024-03-31'),
      validite: 12,
      organismeId: organisme1.id,
      userId: ouvrier2.id,
      entrepriseId: entreprise1.id,
      date_delivrance: new Date('2023-03-10'),
      obligatoire: true,
    },
  });

  // Créer des calendriers/rdv
  const rdv1 = await prisma.calendrier.create({
    data: {
      titre: 'Réunion sécurité mensuelle',
      description: 'Réunion de sécurité obligatoire pour toute l\'équipe',
      date_heure: new Date('2023-11-15T09:00:00'),
      userId: responsable1.id,
      entrepriseId: entreprise1.id,
      statut: 'Planifié',
    },
  });

  const rdv2 = await prisma.calendrier.create({
    data: {
      titre: 'Formation recyclage',
      description: 'Formation recyclage montage échafaudage',
      date_heure: new Date('2023-12-05T08:30:00'),
      userId: ouvrier1.id,
      entrepriseId: entreprise1.id,
      statut: 'Planifié',
    },
  });

  // Créer des devis
  const devis1 = await prisma.devis.create({
    data: {
      userId: admin1.id,
      entrepriseId: entreprise1.id,
      montant: 1250.50,
      statut: 'Validé',
      date_creation: new Date('2023-10-01'),
      date_validation: new Date('2023-10-05'),
      rdv_id: rdv1.id,
    },
  });

  const devis2 = await prisma.devis.create({
    data: {
      userId: admin1.id,
      entrepriseId: entreprise1.id,
      montant: 3200.00,
      statut: 'En attente',
      date_creation: new Date('2023-10-10'),
    },
  });

  // Créer des notifications
  await prisma.notification.create({
    data: {
      userId: ouvrier1.id,
      formationId: formation1.id,
      type: 'FORMATION',
      message: 'Votre formation "Montage échafaudage" expire dans 2 mois',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: responsable1.id,
      type: 'RDV',
      message: 'Nouveau RDV programmé: Réunion sécurité mensuelle',
      isRead: true,
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin1.id,
      type: 'SYSTEM',
      message: 'Nouvelle version de l\'application disponible',
      isRead: false,
    },
  });

  console.log('Seed complété avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });