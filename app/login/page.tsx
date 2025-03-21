"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { motion } from "framer-motion";

// Composant qui utilise useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const { status } = useSession();
  
  // Rediriger vers le dashboard si déjà authentifié
  useEffect(() => {
    if (status === 'authenticated') {
      console.log('Déjà authentifié, redirection vers', redirect);
      router.push(redirect);
    }
  }, [status, router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        toast.error(result.error || 'Identifiants incorrects');
      } else {
        toast.success('Connexion réussie! Redirection en cours...');
        setTimeout(() => {
          router.push(redirect);
        }, 1500);
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  // Afficher un écran de chargement pendant la vérification de la session
  if (status === 'loading') {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Vérification de la session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white relative overflow-hidden">
      {/* Main content container */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-4xl mx-auto">
          {/* Return to home button */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute top-6 left-6 z-20"
          >
            <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-200 transition-colors">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour à l'accueil
            </Link>
          </motion.div>

          {/* Login Card */}
          <div className="grid md:grid-cols-2 gap-8 items-center justify-center w-full">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full flex items-center justify-center"
            >
              <Card className="shadow-xl border border-gray-100 bg-white w-full max-w-lg sm:max-w-xl">
                <CardHeader className="space-y-1 pb-6">
                  <div className="flex justify-center mb-2">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-center text-gray-900">Connexion</CardTitle>
                  <CardDescription className="text-center text-gray-600">
                    Entrez vos identifiants pour accéder à votre espace
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="exemple@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
                        <Link 
                          href="/forgot-password" 
                          className="text-xs text-gray-500 hover:text-blue-600 hover:underline"
                        >
                          Mot de passe oublié?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          required
                        />
                        <button 
                          type="button" 
                          onClick={toggleShowPassword}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none text-gray-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Se souvenir de moi
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Se connecter
                        </>
                      ) : (
                        'Se connecter'
                      )}
                    </Button>
                    
                    <div className="text-center text-sm text-gray-500">
                      Vous n'avez pas de compte? Contactez votre administrateur pour obtenir vos identifiants.
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </motion.div>

            {/* Image Previews of Dashboard */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }} 
              className="space-y-6"
            >
              <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">Découvrez notre plateforme</h3>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
                  alt="Dashboard Analytics"
                  className="w-full h-56 object-cover transition-all duration-700 ease-in-out"
                />
                <div className="p-4">
                  <h4 className="font-semibold">Tableau de bord intuitif</h4>
                  <p className="text-gray-600">Visualisez toutes vos certifications en un coup d'œil</p>
                </div>
              </div>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
                  alt="Calendar View"
                  className="w-full h-56 object-cover transition-all duration-700 ease-in-out"
                />
                <div className="p-4">
                  <h4 className="font-semibold">Gestion des échéances</h4>
                  <p className="text-gray-600">Suivez facilement les dates de renouvellement</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant de chargement
function LoadingLogin() {
  return (
    <div className="flex flex-col min-h-screen bg-white items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="mt-4 text-xl text-gray-600">Chargement...</p>
    </div>
  );
}

// Composant principal qui utilise Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingLogin />}>
      <LoginForm />
    </Suspense>
  );
}
