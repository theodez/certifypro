"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Loader2, Plus, X } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-toastify';

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

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openAddEventDialog, setOpenAddEventDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    userId: '',
    status: 'Planifié',
    createQuote: false,
    quoteAmount: ''
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Calculer la période à afficher (début du mois à fin du mois suivant)
        const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

        // Formater les dates pour l'API
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');

        // Récupérer les événements
        const response = await fetch(`/api/calendrier?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des événements");
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
        toast.error("Impossible de charger les événements du calendrier");
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/utilisateurs');
        if (!response.ok) throw new Error("Erreur lors du chargement des utilisateurs");
        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    };

    fetchEvents();
    fetchUsers();
  }, [currentDate]);

  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.userId || !newEvent.status) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      // Combinaison de la date et l'heure
      const datetime = `${newEvent.date}T${newEvent.time}:00`;

      const payload = {
        titre: newEvent.title,
        description: newEvent.description,
        date_heure: datetime,
        userId: newEvent.userId,
        statut: newEvent.status,
        createDevis: newEvent.createQuote,
        montantDevis: newEvent.createQuote ? newEvent.quoteAmount : undefined
      };

      const response = await fetch('/api/calendrier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la création de l'événement");
      }

      toast.success("Événement créé avec succès");
      setOpenAddEventDialog(false);
      
      // Reset du formulaire
      setNewEvent({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        userId: '',
        status: 'Planifié',
        createQuote: false,
        quoteAmount: ''
      });

      // Recharger les événements
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      const startDateStr = format(start, 'yyyy-MM-dd');
      const endDateStr = format(end, 'yyyy-MM-dd');
      const refreshResponse = await fetch(`/api/calendrier?startDate=${startDateStr}&endDate=${endDateStr}`);
      const refreshData = await refreshResponse.json();
      setEvents(refreshData.events || []);

    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création de l'événement");
    }
  };
  
  // Get all dates in a month to display in calendar grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get start day (Sunday of the week containing the first day)
    const start = startOfWeek(firstDay);
    
    // Create array of dates
    const days = [];
    let currentDay = start;
    
    // Get 42 days (6 weeks) to ensure we cover the whole month
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }
    
    return days;
  };
  
  // Get week days for week view
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    
    return days;
  };
  
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };
  
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Check if date has events
  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.datetime);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };
  
  // Determine if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };
  
  // Determine if date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Get event status style
  const getEventStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planifié':
        return 'bg-blue-100 text-blue-800';
      case 'confirmé':
        return 'bg-green-100 text-green-800';
      case 'effectué':
        return 'bg-purple-100 text-purple-800';
      case 'annulé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            Mois
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'border'}`}
          >
            Semaine
          </button>
          <button 
            onClick={handleToday}
            className="px-3 py-1 border rounded-md text-sm"
          >
            Aujourd'hui
          </button>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevious} className="p-1 rounded-md hover:bg-muted">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-medium">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' d MMMM yyyy", { locale: fr })}
            </h2>
            <button onClick={handleNext} className="p-1 rounded-md hover:bg-muted">
              <ChevronRight size={20} />
            </button>
          </div>
          
          <Dialog open={openAddEventDialog} onOpenChange={setOpenAddEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm flex items-center gap-2">
                <Plus size={16} />
                <span>Ajouter un événement</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Ajouter un événement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Titre *
                  </Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="time" className="text-right">
                    Heure *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="user" className="text-right">
                    Utilisateur *
                  </Label>
                  <Select
                    value={newEvent.userId}
                    onValueChange={(value) => setNewEvent({ ...newEvent, userId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.prenom} {user.nom} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut *
                  </Label>
                  <Select
                    value={newEvent.status}
                    onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planifié">Planifié</SelectItem>
                      <SelectItem value="Confirmé">Confirmé</SelectItem>
                      <SelectItem value="Effectué">Effectué</SelectItem>
                      <SelectItem value="Annulé">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="createQuote" className="text-right">
                    Créer un devis
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <input
                      type="checkbox"
                      id="createQuote"
                      checked={newEvent.createQuote}
                      onChange={(e) => setNewEvent({ ...newEvent, createQuote: e.target.checked })}
                      className="mr-2"
                    />
                  </div>
                </div>
                {newEvent.createQuote && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quoteAmount" className="text-right">
                      Montant (€) *
                    </Label>
                    <Input
                      id="quoteAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newEvent.quoteAmount}
                      onChange={(e) => setNewEvent({ ...newEvent, quoteAmount: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={handleAddEvent}>Ajouter</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 text-sm">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, i) => (
              <div key={i} className="p-2 text-center font-medium border-b">
                {day}
              </div>
            ))}
            
            {getDaysInMonth(currentDate).map((date, i) => {
              const dateEvents = getEventsForDate(date);
              const hasEvents = dateEvents.length > 0;
              
              return (
                <div key={i} className={`min-h-[120px] p-1 border-b border-r 
                  ${!isCurrentMonth(date) ? 'bg-muted/50 text-muted-foreground' : ''} 
                  ${isToday(date) ? 'bg-primary/5' : ''}`}>
                  <div className="flex justify-between p-1">
                    <span className={`h-7 w-7 flex items-center justify-center rounded-full
                      ${isToday(date) ? 'bg-primary text-primary-foreground' : ''}`}>
                      {date.getDate()}
                    </span>
                    {hasEvents && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {dateEvents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 mt-1">
                    {dateEvents.slice(0, 2).map(event => (
                      <div 
                        key={event.id}
                        className={`px-2 py-1 text-xs rounded truncate cursor-pointer ${getEventStatusStyle(event.status)}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        {format(new Date(event.datetime), 'HH:mm')} {event.title}
                      </div>
                    ))}
                    
                    {dateEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground px-2">
                        + {dateEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-8 border-b">
              <div className="p-4 border-r"></div>
              {getWeekDays(currentDate).map((date, i) => (
                <div key={i} className={`p-4 text-center border-r ${isToday(date) ? 'bg-primary/5' : ''}`}>
                  <p className="font-medium">{format(date, 'EEE', { locale: fr })}</p>
                  <p className={`h-8 w-8 flex items-center justify-center mx-auto rounded-full
                    ${isToday(date) ? 'bg-primary text-primary-foreground' : ''}`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="relative h-[600px] overflow-y-auto">
              {Array.from({ length: 12 }).map((_, i) => {
                const hour = i + 8; // Start at 8 AM
                
                return (
                  <div key={i} className="grid grid-cols-8 border-b">
                    <div className="p-2 text-right pr-4 text-sm text-muted-foreground border-r">
                      {format(new Date().setHours(hour, 0), 'HH:mm')}
                    </div>
                    {getWeekDays(currentDate).map((date, dayIndex) => (
                      <div key={dayIndex} className="p-1 border-r relative min-h-[60px]">
                        {events.filter(event => {
                          const eventDate = new Date(event.datetime);
                          const eventHour = eventDate.getHours();
                          return eventDate.getDate() === date.getDate() && 
                                 eventDate.getMonth() === date.getMonth() &&
                                 eventHour === hour;
                        }).map(event => (
                          <div 
                            key={event.id}
                            className={`p-2 rounded text-xs absolute w-[calc(100%-8px)] cursor-pointer ${getEventStatusStyle(event.status)}`}
                            style={{
                              top: `${(new Date(event.datetime).getMinutes() / 60) * 100}%`,
                              height: `${((new Date(event.datetime).getTime() + 3600000 - new Date(event.datetime).getTime()) / (1000 * 60 * 60)) * 100}%`, // Assuming 1 hour events
                              minHeight: '20px'
                            }}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock size={12} />
                              <span>
                                {format(new Date(event.datetime), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Événements à venir</h3>
        <div className="space-y-4">
          {events.length > 0 ? events
            .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
            .slice(0, 4)
            .map(event => (
              <div 
                key={event.id} 
                className={`flex items-start p-3 rounded-md bg-background border-l-4 ${
                  event.status.toLowerCase() === 'planifié' ? 'border-l-blue-500' :
                  event.status.toLowerCase() === 'confirmé' ? 'border-l-green-500' :
                  event.status.toLowerCase() === 'effectué' ? 'border-l-purple-500' :
                  'border-l-red-500'
                }`}
              >
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <CalendarIcon size={14} />
                      <span>{format(new Date(event.datetime), 'EEEE d MMMM', { locale: fr })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>
                        {format(new Date(event.datetime), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap mt-2 gap-2">
                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                      <Users size={12} />
                      <span>{event.user.name}</span>
                    </div>
                    {event.hasQuote && (
                      <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        <span>Devis: {event.quoteAmount}€ ({event.quoteStatus})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:underline text-sm" onClick={() => setSelectedEvent(event)}>Détails</button>
                </div>
              </div>
            ))
            : (
              <p className="text-center text-muted-foreground">Aucun événement à venir</p>
            )
          }
        </div>
      </div>

      {selectedEvent && (
        <Card className="p-6 relative">
          <button 
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" 
            onClick={() => setSelectedEvent(null)}
          >
            <X size={18} />
          </button>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${getEventStatusStyle(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{selectedEvent.description || "Aucune description"}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.datetime), 'EEEE d MMMM - HH:mm', { locale: fr })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedEvent.user.name} ({selectedEvent.user.email})</span>
                </div>
              </div>
              
              {selectedEvent.hasQuote && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Devis associé</span>
                  </div>
                  <ul className="text-sm text-muted-foreground">
                    <li>Montant: {selectedEvent.quoteAmount}€</li>
                    <li>Statut: {selectedEvent.quoteStatus}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Calendar;
