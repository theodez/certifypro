import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Rechercher l'utilisateur dans la base de données
        const user = await prisma.utilisateur.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          console.log("Utilisateur non trouvé");
          return null;
        }

        // Vérifier le mot de passe avec argon2
        const isPasswordValid = await argon2.verify(user.password, credentials.password);

        if (!isPasswordValid) {
          console.log("Mot de passe invalide");
          return null;
        }

        // Ne pas renvoyer le mot de passe
        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
          entrepriseId: user.entrepriseId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.entrepriseId = user.entrepriseId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.entrepriseId = token.entrepriseId as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 