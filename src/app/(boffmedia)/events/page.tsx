"use client"
import React, { useState, useEffect } from 'react';
import { Event } from './types';
import { boffGET } from '@/services/boffAPI';
import { EventCard } from './_components/EventCard';
import { useGetEvents } from '@/hooks/events/useGetEvents';

export default function EventsPage() {
  const { events, error, isLoading, refetch } = useGetEvents()


  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Próximos eventos</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </>
  );
};