import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { CalendarIcon, MapPinIcon } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 text-gray-100 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-orange-300">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>
        <div className="text-sm text-gray-400 space-y-2">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4 text-orange-300" />
            <p>
              {format(new Date(event.startDate), 'PPP')} - {format(new Date(event.endDate), 'PPP')}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          <Link href={`/events/${event.id}`}>
            Ver detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}