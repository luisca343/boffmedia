/*
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event, Game, Achievement } from 'src/_db/schema/Events';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getEvents(): Promise<Event[]> {
    return this.eventsService.getEvents();
  }

  @Get(':id')
  async getEvent(@Param('id', ParseIntPipe) id: number): Promise<Event | null> {
    return this.eventsService.getEvent(id);
  }

  @Post()
  async createEvent(@Body() eventData: Omit<Event, 'id'>) {
    return this.eventsService.createEvent(eventData);
  }

  @Get('games')
  async getGames(): Promise<Game[]> {
    return this.eventsService.getGames();
  }

  @Get(':id/achievements')
  async getAchievements(@Param('id', ParseIntPipe) id: number): Promise<Achievement[]> {
    return this.eventsService.getAchievements(id);
  }
}*/