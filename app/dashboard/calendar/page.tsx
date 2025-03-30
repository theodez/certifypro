"use client";

import React, { useState, useEffect, useMemo, useCallback, memo, useTransition } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, Loader2, Plus, X } from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, parseISO, isSameDay, isEqual, subDays, addDays as addDaysFns } from 'date-fns';
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

// Memoized Day Cell Component
const DayCell = memo(({ 
  date, 
  events, 
  isCurrentMonth, 
  isToday, 
  onEventClick,
  getEventStatusStyle,
  selectedEventId,
}: { 
  date: Date; 
  events: CalendarEvent[];
  isCurrentMonth: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
  onEventClick: (event: CalendarEvent) => void;
  getEventStatusStyle: (status: string) => string;
  selectedEventId: string | null;
}) => {
  const dateEvents = events.filter(event => {
    const eventDate = new Date(event.datetime);
    return isSameDay(eventDate, date);
  });
  
  const hasEvents = dateEvents.length > 0;
  
  return (
    <div 
      className={`min-h-[120px] p-2 border-b border-r transition-colors
        ${!isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'} 
        ${isToday(date) ? 'bg-blue-50' : ''}`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm
          ${isToday(date) ? 'bg-primary text-white font-bold' : ''}
          ${!isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-900'}`}>
          {date.getDate()}
        </span>
        {hasEvents && (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
            {dateEvents.length}
          </span>
        )}
      </div>

      <div className="space-y-1 overflow-hidden">
        {dateEvents.slice(0, 2).map(event => (
          <div 
            key={event.id}
            className={`px-2 py-1 text-xs rounded truncate cursor-pointer ${getEventStatusStyle(event.status)} 
              transition-all duration-200 hover:translate-x-1
              ${selectedEventId === event.id ? 'ring-2 ring-primary shadow-sm translate-x-1' : ''}`}
            onClick={() => onEventClick(event)}
          >
            <div className="flex items-center gap-1">
              <span className="font-medium">{event.title}</span>
            </div>
            <div className="text-xs opacity-80">
              {format(new Date(event.datetime), 'HH:mm')}
            </div>
          </div>
        ))}

        {dateEvents.length > 2 && (
          <div className="text-xs text-gray-500 px-1">
            + {dateEvents.length - 2} autres
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Fix for linter error - don't use isEqual for boolean comparisons
  return isEqual(prevProps.date, nextProps.date) && 
    prevProps.events.length === nextProps.events.length &&
    prevProps.isCurrentMonth(prevProps.date) === nextProps.isCurrentMonth(prevProps.date) &&
    prevProps.isToday(prevProps.date) === nextProps.isToday(prevProps.date) &&
    prevProps.selectedEventId === nextProps.selectedEventId;
});

// Memoized Week Day Cell Component for week view
const WeekDayCell = memo(({ 
  date, 
  isToday 
}: { 
  date: Date; 
  isToday: (date: Date) => boolean; 
}) => (
  <div 
    className={`p-4 text-center border-r ${isToday(date) ? 'bg-blue-50' : 'bg-gray-50'}`}
  >
    <p className="font-medium text-gray-500 uppercase tracking-wider">
      {format(date, 'EEE', { locale: fr })}
    </p>
    <p className={`inline-flex items-center justify-center h-8 w-8 rounded-full mx-auto
      ${isToday(date) ? 'bg-primary text-white font-bold' : 'text-gray-900'}`}>
      {date.getDate()}
    </p>
  </div>
));

// Main Calendar Component
const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [monthsCache, setMonthsCache] = useState<Record<string, CalendarEvent[]>>({});
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

  // Load all events for upcoming events section and users
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const start = new Date();
        const end = new Date();
        end.setFullYear(end.getFullYear() + 1);
        
        const startDateStr = format(start, 'yyyy-MM-dd');
        const endDateStr = format(end, 'yyyy-MM-dd');
        
        const response = await fetch(`/api/calendrier?startDate=${startDateStr}&endDate=${endDateStr}`);
        
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des événements");
        }
        
        const data = await response.json();
        setAllEvents(data.events || []);
      } catch (error) {
        console.error("Erreur lors du chargement de tous les événements:", error);
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

    fetchAllEvents();
    fetchUsers();
  }, []);

  // Function to fetch events for a specific date range
  const fetchEventsForDateRange = useCallback(async (startDate: Date, endDate: Date) => {
    console.log("Fetching events from", format(startDate, 'yyyy-MM-dd'), "to", format(endDate, 'yyyy-MM-dd'));
    
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      const response = await fetch(`/api/calendrier?startDate=${startDateStr}&endDate=${endDateStr}`);
      
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des événements");
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.events?.length || 0} events from API`);
      return data.events || [];
    } catch (error) {
      console.error("Erreur lors du chargement des événements:", error);
      return [];
    }
  }, []);

  // Load events for current view
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      
      try {
        let startDate, endDate;
        
        if (viewMode === 'month') {
          // Pour la vue mois, charger tout le mois plus les jours visibles des mois adjacents
          const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          // Obtenir le premier et le dernier jour affichés dans la grille du calendrier
          const firstDayInGrid = startOfWeek(firstDayOfMonth, { locale: fr });
          const lastDayInGrid = addDays(startOfWeek(lastDayOfMonth, { locale: fr }), 41); // 6 semaines × 7 jours - 1
          
          startDate = firstDayInGrid;
          endDate = lastDayInGrid;
        } else {
          // Pour la vue semaine, charger juste la semaine courante
          const firstDayOfWeek = startOfWeek(currentDate, { locale: fr });
          const lastDayOfWeek = addDays(firstDayOfWeek, 6);
          
          startDate = firstDayOfWeek;
          endDate = lastDayOfWeek;
        }
        
        console.log("Vue:", viewMode, "Période:", format(startDate, 'dd/MM/yyyy'), "au", format(endDate, 'dd/MM/yyyy'));
        
        // Start transition to avoid UI freezes
        startTransition(async () => {
          const fetchedEvents = await fetchEventsForDateRange(startDate, endDate);
          setEvents(fetchedEvents);
        });
      } catch (error) {
        console.error("Erreur lors du chargement des événements:", error);
        toast.error("Impossible de charger les événements du calendrier");
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [currentDate, viewMode, fetchEventsForDateRange]);

  // Load all events for upcoming events section
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const start = new Date();
        const end = new Date();
        end.setFullYear(end.getFullYear() + 1);
        
        const fetchedEvents = await fetchEventsForDateRange(start, end);
        setAllEvents(fetchedEvents);
      } catch (error) {
        console.error("Erreur lors du chargement de tous les événements:", error);
      }
    };

    fetchAllEvents();
  }, [fetchEventsForDateRange]);

  // Navigate to a specific month
  const navigateToMonth = useCallback((date: Date) => {
    startTransition(() => {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
    });
  }, []);

  const handleAddEvent = useCallback(async () => {
    try {
      if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.userId || !newEvent.status) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

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
        throw new Error(error.message || "Erreur lors de la création de l'événement");
      }

      const newEventData = await response.json();
      
      toast.success("Événement créé avec succès");
      setOpenAddEventDialog(false);
      
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

      // Refresh data for the current view
      if (viewMode === 'month') {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const firstDayInGrid = startOfWeek(firstDayOfMonth, { locale: fr });
        const lastDayInGrid = addDays(startOfWeek(lastDayOfMonth, { locale: fr }), 41);
        
        const refreshedEvents = await fetchEventsForDateRange(firstDayInGrid, lastDayInGrid);
        setEvents(refreshedEvents);
      } else {
        const firstDayOfWeek = startOfWeek(currentDate, { locale: fr });
        const lastDayOfWeek = addDays(firstDayOfWeek, 6);
        
        const refreshedEvents = await fetchEventsForDateRange(firstDayOfWeek, lastDayOfWeek);
        setEvents(refreshedEvents);
      }
      
      // Also update allEvents for the upcoming events section
      const now = new Date();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const refreshedAllEvents = await fetchEventsForDateRange(now, futureDate);
      setAllEvents(refreshedAllEvents);
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création de l'événement");
    }
  }, [newEvent, currentDate, viewMode, fetchEventsForDateRange]);

  // Memoized calendar utilities
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);

    const start = startOfWeek(firstDay, { locale: fr });
    const days = [];
    let currentDay = start;

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay = addDaysFns(currentDay, 1);
    }

    return days;
  }, []);

  const getWeekDays = useCallback((date: Date) => {
    // Utiliser fr comme locale pour démarrer la semaine au lundi
    const start = startOfWeek(date, { locale: fr });
    const days = [];

    for (let i = 0; i < 7; i++) {
      days.push(addDaysFns(start, i));
    }

    return days;
  }, []);
  
  const handlePrevious = useCallback(() => {
    startTransition(() => {
    if (viewMode === 'month') {
        setCurrentDate(prev => subMonths(prev, 1));
    } else {
        setCurrentDate(prev => {
          const firstDayOfWeek = startOfWeek(prev, { locale: fr });
          return subDays(firstDayOfWeek, 7);
        });
      }
    });
  }, [viewMode]);
  
  const handleNext = useCallback(() => {
    startTransition(() => {
    if (viewMode === 'month') {
        setCurrentDate(prev => addMonths(prev, 1));
    } else {
        setCurrentDate(prev => {
          const firstDayOfWeek = startOfWeek(prev, { locale: fr });
          return addDays(firstDayOfWeek, 7);
        });
      }
    });
  }, [viewMode]);
  
  const handleToday = useCallback(() => {
    startTransition(() => {
    setCurrentDate(new Date());
    });
  }, []);

  const setViewModeWithRefresh = useCallback((mode: 'month' | 'week') => {
    if (mode !== viewMode) {
      startTransition(() => {
        setViewMode(mode);
        // Forcer le rechargement des données lors du changement de mode
        setMonthsCache({}); // Vider le cache pour recharger toutes les données
      });
    }
  }, [viewMode]);

  const isToday = useCallback((date: Date) => {
    return isSameDay(date, new Date());
  }, []);

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  }, [currentDate]);

  const getEventStatusStyle = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      'planifié': 'bg-blue-100 text-blue-800 border-l-4 border-blue-500',
      'confirmé': 'bg-green-100 text-green-800 border-l-4 border-green-500',
      'effectué': 'bg-purple-100 text-purple-800 border-l-4 border-purple-500',
      'annulé': 'bg-red-100 text-red-800 border-l-4 border-red-500'
    };
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-l-4 border-gray-500';
  }, []);

  const getEventStatusColor = useCallback((status: string) => {
    const statusMap: Record<string, string> = {
      'planifié': 'bg-blue-500',
      'confirmé': 'bg-green-500',
      'effectué': 'bg-purple-500',
      'annulé': 'bg-red-500'
    };
    return statusMap[status.toLowerCase()] || 'bg-gray-500';
  }, []);

  // Memoized weekdays
  const weekDays = useMemo(() => ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], []);
  
  // Memoized days for current month view
  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate, getDaysInMonth]);
  
  // Memoized days for current week view
  const weekDays2 = useMemo(() => getWeekDays(currentDate), [currentDate, getWeekDays]);
  
  // Memoized upcoming events
  const upcomingEvents = useMemo(() => 
    allEvents
      .filter(event => new Date(event.datetime) >= new Date())
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(0, 5),
    [allEvents]
  );

  if (loading) {
  return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="relative w-10 h-10">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-t-4 border-primary rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Chargement du calendrier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1">
            <Button 
              onClick={() => setViewModeWithRefresh('month')}
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
            >
              Mois
            </Button>
            <Button 
              onClick={() => setViewModeWithRefresh('week')}
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
            >
            Semaine
            </Button>
          </div>
          
          <div className="flex items-center rounded-md border overflow-hidden">
            <Button 
              onClick={handlePrevious} 
              variant="ghost" 
              size="sm" 
              className="p-1.5 hover:bg-accent"
              disabled={isPending}
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="px-3 py-1 text-sm font-medium min-w-[180px] text-center">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semaine du' d MMMM yyyy", { locale: fr })}
            </span>
            <Button 
              onClick={handleNext} 
              variant="ghost" 
              size="sm" 
              className="p-1.5 hover:bg-accent"
              disabled={isPending}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleToday}
            variant="outline" 
            size="sm"
            disabled={isPending}
          >
            Aujourd'hui
          </Button>
          
          <Dialog open={openAddEventDialog} onOpenChange={setOpenAddEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" size="sm">
                <Plus size={16} className="mr-2" />
                Ajouter un événement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">Nouvel événement</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
        </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                  />
      </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
          </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Heure *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
        </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="user">Utilisateur *</Label>
                  <Select
                    value={newEvent.userId}
                    onValueChange={(value) => setNewEvent({ ...newEvent, userId: value })}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="status">Statut *</Label>
                  <Select
                    value={newEvent.status}
                    onValueChange={(value) => setNewEvent({ ...newEvent, status: value })}
                  >
                    <SelectTrigger>
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="createQuote"
                    checked={newEvent.createQuote}
                    onChange={(e) => setNewEvent({ ...newEvent, createQuote: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="createQuote">Créer un devis</Label>
                      </div>

                {newEvent.createQuote && (
                  <div className="space-y-2">
                    <Label htmlFor="quoteAmount">Montant (€) *</Label>
                    <Input
                      id="quoteAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newEvent.quoteAmount}
                      onChange={(e) => setNewEvent({ ...newEvent, quoteAmount: e.target.value })}
                    />
                  </div>
                )}
                  </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenAddEventDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleAddEvent}>Ajouter l'événement</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
                </div>

      <div className={`bg-white rounded-lg border shadow-sm overflow-hidden transition-opacity duration-300 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7 text-sm">
            {weekDays.map((day, i) => (
              <div key={i} className="p-3 text-center font-medium border-b bg-gray-50 text-gray-500 uppercase tracking-wider">
                {day}
          </div>
            ))}

            <div className="col-span-7 grid grid-cols-7 animate-fadeIn">
              {daysInMonth.map((date, i) => (
                <DayCell 
                  key={`${date.toISOString()}-${i}`}
                  date={date}
                  events={events}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  onEventClick={setSelectedEvent}
                  getEventStatusStyle={getEventStatusStyle}
                  selectedEventId={selectedEvent?.id || null}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-8 border-b">
              <div className="p-4 border-r bg-gray-50"></div>
              {weekDays2.map((date, i) => (
                <WeekDayCell 
                  key={`${date.toISOString()}-${i}`}
                  date={date}
                  isToday={isToday}
                />
              ))}
            </div>

            <div className="relative h-[600px] overflow-y-auto">
              {Array.from({ length: 14 }).map((_, i) => {
                const hour = i + 7;

                return (
                  <div key={i} className="grid grid-cols-8 border-b">
                    <div className="p-2 text-right pr-4 text-sm text-gray-500 border-r bg-gray-50">
                      {format(new Date().setHours(hour, 0), 'HH:mm')}
                    </div>
                    {weekDays2.map((date, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className="p-1 border-r relative min-h-[60px] hover:bg-gray-50 transition-colors"
                      >
                        {events.filter(event => {
                          const eventDate = new Date(event.datetime);
                          const eventHour = eventDate.getHours();
                          return isSameDay(eventDate, date) && eventHour === hour;
                        }).map(event => {
                          // Calcul précis de la position et durée de l'événement
                          const eventDate = new Date(event.datetime);
                          const eventMinutes = eventDate.getMinutes();
                          const topPosition = (eventMinutes / 60) * 100;
                          
                          // Pour simplifier, on suppose que chaque événement dure 1 heure
                          // Mais on pourrait utiliser la durée réelle si disponible dans l'API
                          const eventDuration = 60; // en minutes
                          const heightPercentage = (eventDuration / 60) * 100;
                          
                          return (
                            <div 
                            key={event.id}
                              className={`p-2 rounded text-xs absolute w-[calc(100%-8px)] cursor-pointer shadow-sm
                                ${getEventStatusStyle(event.status)} 
                                transition-transform duration-200 hover:translate-y-[-2px] hover:shadow-md
                                ${selectedEvent?.id === event.id ? 'ring-2 ring-primary shadow-md -translate-y-1' : ''}`}
                            style={{
                                top: `${topPosition}%`,
                                height: `${heightPercentage}%`,
                                minHeight: '24px',
                                zIndex: selectedEvent?.id === event.id ? 10 : 1
                              }}
                              onClick={() => setSelectedEvent(event)}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="flex items-center gap-1 mt-0.5 text-xs opacity-80">
                              <Clock size={12} />
                              <span>
                                  {format(eventDate, 'HH:mm')}
                              </span>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isPending && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
        )}
                  </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Prochains rendez-vous</h3>
            <span className="text-sm text-gray-500">
              {format(new Date(), 'd MMMM yyyy', { locale: fr })}
                    </span>
                  </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Date</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Heure</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Titre</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Client</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Statut</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y animate-fadeIn">
                {upcomingEvents.length > 0 ? upcomingEvents.map(event => (
                  <tr key={event.id} className={`hover:bg-gray-50 transition-colors 
                    ${selectedEvent?.id === event.id ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(event.datetime), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(event.datetime), 'HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{event.title}</td>
                    <td className="px-4 py-3 text-sm">{event.user.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventStatusStyle(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                          className="transition-transform hover:scale-105"
                        >
                          Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigateToMonth(new Date(event.datetime))}
                          className="text-xs transition-all duration-200 hover:bg-primary/10"
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          Voir
                        </Button>
                </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Aucun rendez-vous à venir
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
                    </div>
        </CardContent>
      </Card>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[600px] animate-dialogShow">
            <DialogHeader>
              <DialogTitle className="text-xl">Détails du rendez-vous</DialogTitle>
            </DialogHeader>
        <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-3 w-3 rounded-full ${getEventStatusColor(selectedEvent.status)}`}></span>
                  <span className="font-medium capitalize">{selectedEvent.status.toLowerCase()}</span>
                    </div>
                <h4 className="text-lg font-medium">{selectedEvent.title}</h4>
                <p className="text-gray-600 mt-1">{selectedEvent.description || "Aucune description"}</p>
                  </div>

              <div className="grid gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
                  <div>
                    <h5 className="font-medium text-gray-700">Date et heure</h5>
                    <p className="text-gray-600">
                      {format(new Date(selectedEvent.datetime), 'EEEE d MMMM yyyy', { locale: fr })}
                      <br />
                      {format(new Date(selectedEvent.datetime), 'HH:mm')}
                    </p>
              </div>
            </div>

                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Users className="h-5 w-5 text-purple-600" />
        </div>
            <div>
                    <h5 className="font-medium text-gray-700">Client</h5>
                    <p className="text-gray-600">
                      {selectedEvent.user.name}
                      <br />
                      {selectedEvent.user.email}
                    </p>
            </div>
                </div>
                
                {selectedEvent.hasQuote && (
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                <div>
                      <h5 className="font-medium text-gray-700">Devis</h5>
                      <p className="text-gray-600">
                        Montant: {selectedEvent.quoteAmount}€
                        <br />
                        Statut: {selectedEvent.quoteStatus}
                      </p>
                  </div>
                </div>
              )}
            </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  Modifier
                </Button>
                <Button variant="destructive" className="flex-1">
                  Annuler
                </Button>
          </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default memo(Calendar);

// Add these styles at the end of the file
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialogShow {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-dialogShow {
  animation: dialogShow 0.2s ease-out;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}