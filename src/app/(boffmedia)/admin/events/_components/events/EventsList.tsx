"use client"

import { CardContent } from "@/components/ui/primitives/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/primitives/table"
import type { Event } from "@/types/events"
import { EventCard } from "./EventCard"
import { EventEmptyState } from "./EventEmptyState"
import React from "react"
import { useTranslations } from "next-intl"

interface EventsListProps {
  events: Event[]
  onEdit: (event: Event) => void
  onDelete: (event: Event) => void
}

export function EventsList({ events, onEdit, onDelete }: EventsListProps) {
  const t = useTranslations('boffmedia')
  
  // Group events by their hierarchy
  const groupedEvents = events.reduce((acc, event) => {
    if (!event.parentId) {
      // Parent event
      acc.set(event.id, {
        parent: event,
        children: events.filter((e) => e.parentId === event.id),
      })
    } else if (!acc.has(event.parentId)) {
      // Orphaned child event (parent not in list)
      acc.set(event.id, {
        parent: event,
        children: [],
      })
    }
    return acc
  }, new Map())

  if (events.length === 0) {
    return (
      <CardContent>
        <EventEmptyState />
      </CardContent>
    )
  }

  return (
    <CardContent>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-surface-700">
              <TableHead className="text-surface-300">{t('admin.events.table.event')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.events.table.game')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.events.table.startDate')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.events.table.endDate')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.events.table.status')}</TableHead>
              <TableHead className="text-surface-300">{t('admin.events.table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from(groupedEvents.values()).map(({ parent, children }) => (
              <React.Fragment key={parent.id}>
                <EventCard
                  key={parent.id}
                  event={parent}
                  onEdit={() => onEdit(parent)}
                  onDelete={() => onDelete(parent)}
                  isParent={children.length > 0}
                />
                {children.map((child: Event) => (
                  <EventCard
                    key={child.id}
                    event={child}
                    onEdit={() => onEdit(child)}
                    onDelete={() => onDelete(child)}
                    isChild={true}
                    parentEvent={parent}
                  />
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  )
}

