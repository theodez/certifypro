"use client";

import React, { useState } from 'react';

import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users } from 'lucide-react';

import { format, addDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

import { fr } from 'date-fns/locale';

import { Card } from '@/components/ui/card';

const Calendar = () => {

  const [currentDate, setCurrentDate] = useState(new Date());

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  

  const events = [

    { 

      id: 1, 

      title: 'Réunion d\'équipe', 

      start: addDays(new Date(), 1).setHours(10, 0), 

      end: addDays(new Date(), 1).setHours(11, 30), 

      type: 'meeting',

      location: 'Salle de réunion A',

      participants: ['Jean Dupont', 'Marie Martin', 'Pierre Durand'],

      description: 'Réunion hebdomadaire de suivi des projets'

    },

    { 

      id: 2, 

      title: 'Revue de projet', 

      start: addDays(new Date(), 2).setHours(14, 0), 

      end: addDays(new Date(), 2).setHours(15, 0), 

      type: 'work',

      location: 'Bureau principal',

      participants: ['Sophie Bernard', 'Lucas Petit'],

      description: 'Revue des avancées du projet CertifSaaS'

    },

    { 

      id: 3, 

      title: 'Appel client', 

      start: addDays(new Date(), 3).setHours(11, 0), 

      end: addDays(new Date(), 3).setHours(12, 0), 

      type: 'call',

      location: 'Visioconférence',

      participants: ['Jean Dupont', 'Client A'],

      description: 'Point d\'étape mensuel'

    },

    { 

      id: 4, 

      title: 'Formation', 

      start: addDays(new Date(), 4).setHours(9, 0), 

      end: addDays(new Date(), 4).setHours(16, 0), 

      type: 'workshop',

      location: 'Centre de formation',

      participants: ['Équipe complète'],

      description: 'Formation sur les nouvelles normes de sécurité'

    },

    { 

      id: 5, 

      title: 'Deadline: Rapport T3', 

      start: addDays(new Date(), 5).setHours(17, 0), 

      end: addDays(new Date(), 5).setHours(17, 0), 

      type: 'deadline',

      description: 'Remise du rapport trimestriel'

    },

  ];

  

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

      const eventDate = new Date(event.start);

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

  

  return (

    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>

          <p className="text-muted-foreground mt-2">

            Gérez votre planning et vos événements

          </p>

        </div>

        

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

          

          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm flex items-center gap-2">

            <CalendarIcon size={16} />

            <span>Add Event</span>

          </button>

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

                        className={`px-2 py-1 text-xs rounded truncate

                          ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :

                           event.type === 'call' ? 'bg-green-100 text-green-800' :

                           event.type === 'work' ? 'bg-purple-100 text-purple-800' :

                           event.type === 'workshop' ? 'bg-orange-100 text-orange-800' :

                           'bg-red-100 text-red-800'}`}

                      >

                        {format(new Date(event.start), 'HH:mm')} {event.title}

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

                          const eventDate = new Date(event.start);

                          const eventHour = eventDate.getHours();

                          return eventDate.getDate() === date.getDate() && 

                                 eventDate.getMonth() === date.getMonth() &&

                                 eventHour === hour;

                        }).map(event => (

                          <div 

                            key={event.id}

                            className={`p-2 rounded text-xs absolute w-[calc(100%-8px)] 

                              ${event.type === 'meeting' ? 'bg-blue-100 text-blue-800' :

                               event.type === 'call' ? 'bg-green-100 text-green-800' :

                               event.type === 'work' ? 'bg-purple-100 text-purple-800' :

                               event.type === 'workshop' ? 'bg-orange-100 text-orange-800' :

                               'bg-red-100 text-red-800'}`}

                            style={{

                              top: `${(new Date(event.start).getMinutes() / 60) * 100}%`,

                              height: `${((new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)) * 100}%`,

                              minHeight: '20px'

                            }}

                          >

                            <div className="font-medium">{event.title}</div>

                            <div className="flex items-center gap-1 mt-1">

                              <Clock size={12} />

                              <span>

                                {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}

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

        <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>

        <div className="space-y-4">

          {events.slice(0, 4).map(event => (

            <div key={event.id} className="flex items-start border-l-4 p-3 rounded-md 

              bg-background

              border-l-blue-500">

              <div className="flex-1">

                <h4 className="font-medium">{event.title}</h4>

                <div className="flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground gap-2 mt-1">

                  <div className="flex items-center gap-1">

                    <CalendarIcon size={14} />

                    <span>{format(new Date(event.start), 'EEEE d MMMM', { locale: fr })}</span>

                  </div>

                  <div className="flex items-center gap-1">

                    <Clock size={14} />

                    <span>

                      {format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}

                    </span>

                  </div>

                </div>

                {event.type === 'meeting' && (

                  <div className="flex flex-wrap mt-2 gap-2">

                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">

                      <MapPin size={12} />

                      <span>{event.location}</span>

                    </div>

                    <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">

                      <Users size={12} />

                      <span>{event.participants?.length || 0} participants</span>

                    </div>

                  </div>

                )}

              </div>

              <div className="flex gap-2">

                <button className="text-blue-600 hover:underline text-sm" onClick={() => setSelectedEvent(event)}>Edit</button>

                <button className="text-red-600 hover:underline text-sm">Delete</button>

              </div>

            </div>

          ))}

        </div>

      </div>

      {selectedEvent && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
              <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(selectedEvent.start), 'EEEE d MMMM - HH:mm', { locale: fr })} - 
                    {format(new Date(selectedEvent.end), 'HH:mm', { locale: fr })}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
              
              {selectedEvent.participants && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Participants</span>
                  </div>
                  <ul className="text-sm text-muted-foreground">
                    {selectedEvent.participants.map((participant: string, index: number) => (
                      <li key={index}>{participant}</li>
                    ))}
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