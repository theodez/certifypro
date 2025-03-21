"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Shield, Users, Calendar, FileCheck, QrCode, Bell, BarChart, Smartphone, Lock, Headphones, Crown, LogOut } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useSession, signOut } from "next-auth/react";
import { Suspense } from "react";

// Composant de chargement pour Suspense
function LoadingHomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white items-center justify-center">
      <div className="animate-pulse bg-gray-200 h-16 w-40 rounded-md mb-8"></div>
      <div className="animate-pulse bg-gray-200 h-8 w-64 rounded-md mb-4"></div>
      <div className="animate-pulse bg-gray-200 h-8 w-48 rounded-md"></div>
    </div>
  );
}

// Composant pour les actions
function HomeActions() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };
  
  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      {isAuthenticated ? (
        <>
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
              Tableau de bord
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="w-full sm:w-auto" 
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Se déconnecter
          </Button>
        </>
      ) : (
        <>
          <Link href="/demo">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
              Demander une démo
              <ArrowRight className="ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Se connecter
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const features = [
    {
      icon: FileCheck,
      title: "Centralisez et suivez les formations",
      description: "Visite médicale, CACES, et bien plus encore.",
    },
    {
      icon: QrCode,
      title: "Facilitez le contrôle de conformité",
      description: "Présentez un QR Code en cas de contrôle interne ou externe.",
    },
    {
      icon: Users,
      title: "Personnalisez votre environnement",
      description: "Création d'équipes chantier, attribution des rôles.",
    },
    {
      icon: Bell,
      title: "Anticipation et conformité",
      description: "Alertes automatiques avant recyclages ou péremption (SMS, email).",
    },
    {
      icon: Calendar,
      title: "Planification",
      description: "Ajoutez et suivez vos rendez-vous, recevez des rappels.",
    },
    {
      icon: BarChart,
      title: "Analyses & reporting",
      description: "Visualisez via le tableau de bord et les statistiques.",
    },
    {
      icon: FileCheck,
      title: "Saisie des certifications",
      description: "Nous nous chargeons de la saisie de vos certifications dans le logiciel.",
      premium: true,
    },
    {
      icon: Calendar,
      title: "Gestion des devis",
      description: "Demandez et recevez des devis pour vos recyclages directement dans l'application.",
      premium: true,
    },
    {
      icon: CheckCircle,
      title: "Intégration des rendez-vous",
      description: "Acceptez les devis et retrouvez automatiquement vos RDV dans l'interface.",
      premium: true,
    },
  ];

  const faqs = [
    {
      question: "À qui s'adresse cette solution ?",
      answer: "Cette solution s'adresse à toutes les entreprises du BTP et des secteurs connexes, qui souhaitent gérer les formations de leurs salariés.",
    },
    {
      question: "Comment fonctionnent les alertes automatiques ?",
      answer: "Vous choisissez combien de temps à l'avance et via quel canal (SMS ou email) vous souhaitez être avertis avant un RDV ou l'expiration d'une formation.",
    },
    {
      question: "Est-ce sécurisé ?",
      answer: "Les données sont stockées conformément à la règlementation RGPD. Vous pouvez à tout moment depuis le logiciel ou l'application demander l'accès à vos données ou demander une modification.",
    },
    {
      question: "Comment sont gérés les devis et intégrations de RDV ?",
      answer: "Vous demandez à recevoir des devis pour un recyclage d'une formation qui va expirer prochainement. Vous nous indiquez une période de disponibilité pour le recyclage, et nous vous envoyons des devis dans le logiciel. Une fois le devis accepté, votre entreprise procède au paiement et nous intégrons ensuite le RDV à votre calendrier.",
    },
    {
      question: "Y a-t-il une période d'essai gratuite ?",
      answer: "Pour les 50 premières entreprises accompagnées, le premier mois est offert.",
    },
  ];

  return (
    <div className="min-h-screen bg-white relative">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center relative"
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4"
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                Nouveau : Application mobile disponible
              </span>
            </motion.div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 tracking-tight">
              Gestion des formations
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> simplifiée et optimisée</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Optimisez la gestion de vos formations en entreprise avec notre solution de dématérialisation
            </p>
            <Suspense fallback={
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <div className="animate-pulse bg-blue-200 h-12 w-52 rounded-md"></div>
                <div className="animate-pulse bg-gray-200 h-12 w-52 rounded-md"></div>
              </div>
            }>
              <HomeActions />
            </Suspense>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Une interface pensée pour les entreprises</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez notre tableau de bord pour visualiser ce dont vous avez besoin en un coup d'œil
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-xl overflow-hidden shadow-2xl border border-gray-200"
          >
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1920&q=80"
              alt="Dashboard Preview"
              className="w-full h-[800px] object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "Entreprises", label: "Solution conçue pour vous" },
              { number: "50+", label: "Types de formations intégrées" },
              { number: "Sécurisé", label: "Stockage des données" },
              { number: "24/7", label: "Support client" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center"
              >
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Une suite complète d'outils pour gérer efficacement vos formations
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden"
              >
                <div className="relative">
                  {feature.premium && (
                    <Badge className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-yellow-600">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Application Mobile</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Gérez vos formations en toute mobilité
            </p>
          </motion.div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-3xl p-1">
                <div className="bg-white rounded-[22px] p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Smartphone className="w-12 h-12 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold">Pour les utilisateurs</h3>
                      <p className="text-gray-600">Accès rapide à vos formations</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Visualisation des formations</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Génération de QR codes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Notifications en temps réel</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-1">
                <div className="bg-white rounded-[22px] p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <QrCode className="w-12 h-12 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold">Pour les contrôleurs</h3>
                      <p className="text-gray-600">Vérification simplifiée</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Scan des QR codes</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Vérification instantanée</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>Historique des contrôles</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-cyan-500">Sécurité & Fiabilité</Badge>
            <h2 className="text-3xl font-bold mb-4">Une solution de confiance</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nous mettons en œuvre les meilleures pratiques pour garantir la sécurité et la fiabilité de notre service
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              {
                icon: Lock,
                title: "Données sécurisées",
                description: "Stockage conforme RGPD",
              },
              {
                icon: Shield,
                title: "Protection avancée",
                description: "Chiffrement de bout en bout",
              },
              {
                icon: Users,
                title: "Support réactif",
                description: "Équipe dédiée 24/7",
              },
              {
                icon: CheckCircle,
                title: "Haute disponibilité",
                description: "99.9% de temps de service",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
            <p className="text-gray-600">
              Tout ce que vous devez savoir sur notre solution
            </p>
          </motion.div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <AccordionTrigger className="text-left px-6 py-4 text-lg font-medium hover:bg-blue-50">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-700">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1920&q=80')] opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">Prêt à optimiser la gestion de vos formations ?</h2>
              <p className="text-xl mb-8 opacity-90">
                Rejoignez les entreprises qui nous font déjà confiance
              </p>
              <Link href="/demo">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  Demander une démo gratuite
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}