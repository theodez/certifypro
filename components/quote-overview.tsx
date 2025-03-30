"use client"

import { useState, useEffect } from "react";
import { Check, Clock, CircleDollarSign, Ban, ArrowUpDown, DollarSign } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils/date";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Quote {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  eventTitle?: string;
  userName: string;
}

export function QuoteOverview() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        setLoading(true);
        
        // Récupérer tous les événements avec devis
        const response = await fetch('/api/calendrier');
        
        if (!response.ok) {
          throw new Error("Impossible de charger les devis");
        }
        
        const data = await response.json();
        
        // Filtrer les événements qui ont un devis associé
        const eventsWithQuotes = data.events.filter((event: any) => event.hasQuote);
        
        // Transformer les données pour l'affichage
        const formattedQuotes = eventsWithQuotes.map((event: any) => ({
          id: event.id,
          amount: event.quoteAmount,
          status: event.quoteStatus,
          createdAt: event.datetime, // On utilise la date de l'événement comme approximation
          eventTitle: event.title,
          userName: event.user.name
        }));
        
        // Trier par date (plus récent en premier)
        formattedQuotes.sort((a: Quote, b: Quote) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setQuotes(formattedQuotes);
      } catch (err) {
        console.error("Erreur lors du chargement des devis:", err);
        setError("Impossible de charger les devis");
      } finally {
        setLoading(false);
      }
    }

    fetchQuotes();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "validé":
        return <Check className="h-4 w-4 text-green-500" />;
      case "en attente":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "payé":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "refusé":
        return <Ban className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>{error}</p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <CircleDollarSign className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>Aucun devis en cours</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Détails</TableHead>
          <TableHead>Montant</TableHead>
          <TableHead>Statut</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {quotes.slice(0, 5).map((quote) => (
          <TableRow key={quote.id}>
            <TableCell>
              <div className="font-medium">{quote.eventTitle}</div>
              <div className="text-sm text-muted-foreground">{quote.userName}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(new Date(quote.createdAt))}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {formatAmount(quote.amount)}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="flex items-center gap-1">
                {getStatusIcon(quote.status)}
                <span>{quote.status}</span>
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}