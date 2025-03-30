"use client"

import { useState, useEffect } from "react";
import { Calendar, ClockIcon, UserCircle, CalendarDaysIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils/date";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  datetime: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  hasQuote: boolean;
  quoteStatus: string | null;
  quoteAmount: number | null;
}

export function UpcomingAppointments() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        // Calculer la date de début (aujourd'hui) et la date de fin (dans 30 jours)
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 30);

        // Formater les dates pour l'URL
        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        // Faire la requête avec les paramètres de date
        const response = await fetch(`/api/calendrier?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        if (!response.ok) {
          throw new Error("Impossible de charger les rendez-vous");
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error("Erreur lors du chargement des rendez-vous:", err);
        setError("Impossible de charger les rendez-vous");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "planifié":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "confirmé":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "effectué":
        return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400";
      case "annulé":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-start space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
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

  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <CalendarDaysIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>Aucun rendez-vous à venir</p>
        <Button variant="outline" className="mt-4">
          Planifier un rendez-vous
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.slice(0, 5).map((event) => (
        <div key={event.id} className="flex items-start space-x-4">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={undefined} />
            <AvatarFallback>{getInitials(event.user.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1 flex-1">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">{event.title}</h4>
              <Badge className={getStatusBadgeColor(event.status)}>
                {event.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <UserCircle className="h-3.5 w-3.5" />
                <span>{event.user.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> 
                <span>{formatDate(new Date(event.datetime))}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>{formatTime(new Date(event.datetime))}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {events.length > 5 && (
        <div className="text-center pt-2">
          <Button variant="link" size="sm">
            Voir tous les rendez-vous ({events.length})
          </Button>
        </div>
      )}
    </div>
  );
}