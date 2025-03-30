"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarContentProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

function NavbarContent({ isOpen, setIsOpen }: NavbarContentProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
  };

  return (
    <>
      <div className="hidden md:flex items-center space-x-6">
        <Link href="#features" className="text-gray-600 hover:text-gray-900">
          Fonctionnalités
        </Link>
        <Link href="#pricing" className="text-gray-600 hover:text-gray-900">
          Tarifs
        </Link>

        {isAuthenticated ? (
          <>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Tableau de bord
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {session?.user?.name || "Mon compte"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Paramètres</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Link href="/demo">
              <Button variant="outline" size="sm">
                Démo
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600">
                Se connecter
              </Button>
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu - AnimatePresence pour gérer les transitions */}
      {/* Le menu mobile est désormais en-dehors de la navbar pour être positionné par-dessus tout le contenu */}
    </>
  );
}

export function Navbar() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Empêcher le défilement quand le menu est ouvert
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            CertifyPro
          </Link>
          <button 
            className="md:hidden flex items-center justify-center" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu principal"
          >
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <Suspense fallback={<div className="hidden md:flex space-x-8"><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></div>}>
            {isMounted && <NavbarContent isOpen={isOpen} setIsOpen={setIsOpen} />}
          </Suspense>
        </div>
      </motion.nav>

      {/* Overlay et Menu Mobile détachés de la navbar pour apparaître en plein écran */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay flou couvrant tout l'écran */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu latéral mobile */}
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-end items-center p-3">
                <button 
                  className="p-2 rounded-full hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fermer le menu"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 pt-0 pb-6">
                <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded"></div></div>}>
                  {isMounted && (
                    <MobileMenu setIsOpen={setIsOpen} />
                  )}
                </Suspense>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Composant séparé pour le menu mobile
function MobileMenu({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" });
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-500 uppercase">Navigation</p>
        <nav className="flex flex-col space-y-3">
          <Link 
            href="#features" 
            className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Fonctionnalités
          </Link>
          <Link 
            href="#pricing" 
            className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Tarifs
          </Link>
        </nav>
      </div>

      {isAuthenticated ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase">Mon espace</p>
          <div className="flex flex-col space-y-3">
            <Link 
              href="/dashboard" 
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Tableau de bord
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Paramètres
            </Link>
            <button 
              onClick={handleSignOut}
              className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-left w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col space-y-3">
            <Link 
              href="/demo" 
              onClick={() => setIsOpen(false)}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Démo
            </Link>
            <Link 
              href="/login" 
              onClick={() => setIsOpen(false)}
              className="inline-flex justify-center items-center px-4 py-2 rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
            >
              Se connecter
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
