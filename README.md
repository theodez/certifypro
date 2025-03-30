# CertifyPro

CertifyPro est une application complète de gestion des certifications, formations et équipes pour les entreprises du secteur industriel. Cette plateforme permet de suivre efficacement les certifications des employés, gérer les équipes et planifier les rendez-vous.

![CertifyPro Logo](https://via.placeholder.com/150)

## 🚀 Fonctionnalités

- **Gestion des employés**
  - Création et modification de profils d'employés
  - Suivi des informations personnelles et professionnelles
  - Attribution à des équipes spécifiques

- **Gestion des équipes**
  - Création et modification d'équipes
  - Attribution de responsables et membres
  - Suivi des activités par équipe

- **Suivi des formations et certifications**
  - Enregistrement des formations suivies par les employés
  - Alerte pour les certifications expirées ou à renouveler
  - Statistiques sur l'état des certifications

- **Calendrier et rendez-vous**
  - Planification de rendez-vous et événements
  - Suivi des statuts (planifié, effectué, annulé)
  - Visualisation du calendrier par utilisateur ou entreprise

- **Gestion des devis**
  - Création et suivi des devis
  - Statuts de progression (en attente, validé, refusé, payé)
  - Liaison avec les rendez-vous

- **Notifications**
  - Alertes pour les certifications expirantes
  - Rappels de rendez-vous
  - Notifications système

## 💻 Technologies utilisées

- **Frontend**
  - Next.js 15
  - React 19
  - Tailwind CSS
  - shadcn/ui (composants UI)
  - React Hook Form pour la gestion des formulaires
  - Zod pour la validation des données

- **Backend**
  - API Routes de Next.js
  - Prisma ORM
  - NextAuth.js pour l'authentification
  - Argon2 pour le hachage des mots de passe

- **Base de données**
  - PostgreSQL
  - Migrations Prisma

## 🛠️ Installation

### Prérequis

- Node.js (v18 ou supérieur)
- pnpm (v10 ou supérieur)
- PostgreSQL

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/theodez/certifypro.git
   cd certifypro
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configuration de la base de données**
   
   Vous pouvez utiliser Docker pour démarrer une instance PostgreSQL :
   ```bash
   docker-compose up -d
   ```
   
   Ou configurer votre propre instance PostgreSQL et mettre à jour le fichier `.env` :
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/projet2?schema=public"
   ```

4. **Appliquer les migrations et peupler la base de données**
   ```bash
   npx prisma migrate reset --force
   ```
   Cette commande applique toutes les migrations et exécute le script de seed pour peupler la base de données.

5. **Démarrer l'application en mode développement**
   ```bash
   pnpm dev
   ```
   L'application sera accessible à l'adresse `http://localhost:3000`.

## 🧪 Structure du projet

```
certifypro/
├── app/                    # Application Next.js (App Router)
│   ├── api/                # API Routes
│   ├── dashboard/          # Pages du tableau de bord
│   ├── login/              # Authentication pages
│   └── page.tsx            # Page d'accueil
├── components/             # Composants React
│   ├── dashboard/          # Composants spécifiques au tableau de bord
│   └── ui/                 # Composants UI réutilisables
├── hooks/                  # Custom React hooks
├── lib/                    # Bibliothèques et utilitaires
│   ├── auth.ts             # Configuration de l'authentification
│   ├── prisma.ts           # Client Prisma
│   ├── rbac.ts             # Contrôle d'accès basé sur les rôles
│   └── utils/              # Fonctions utilitaires
├── prisma/                 # Configuration Prisma
│   ├── migrations/         # Migrations de base de données
│   ├── schema.prisma       # Schéma de base de données
│   └── seed.ts             # Script de peuplement
└── types/                  # Définitions de types TypeScript
```

## 🔐 Authentification

L'application utilise NextAuth.js pour l'authentification. Les rôles disponibles sont :

- **Admin** : Accès complet à toutes les fonctionnalités
- **Représentant** : Gestion des équipes et des employés
- **Agent** : Accès limité aux fonctionnalités de base

## 🚢 Déploiement

L'application est configurée pour un déploiement sur Vercel :

```bash
pnpm build
vercel deploy
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou soumettre une pull request.

## 📄 Licence

Ce projet est sous licence [MIT](LICENSE).

## 🙏 Remerciements

- [shadcn/ui](https://ui.shadcn.com) pour les composants UI
- [NextAuth.js](https://next-auth.js.org) pour l'authentification
- [Prisma](https://prisma.io) pour l'ORM 