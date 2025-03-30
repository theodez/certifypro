import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as argon2 from 'argon2';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur par email
    const user = await prisma.utilisateur.findUnique({
      where: { email: email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Vérification du mot de passe avec argon2
    const passwordMatch = await argon2.verify(user.password, password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Ne pas renvoyer le mot de passe dans la réponse
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
} 