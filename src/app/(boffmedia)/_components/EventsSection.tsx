"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Calendar, Medal, Trophy, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetEvents } from "@/hooks/events/useGetEvents"
import { useGetLeaderboards } from "@/hooks/events/useGetLeaderboards"
import { InternalLink } from "@/components/nav/Link"
import { LeaderboardEntry } from "@/types/events"
import { useTranslations } from "next-intl"

export function EventsSection() {
  const t = useTranslations("boffmedia.eventsSection");
  const { events, error, isLoading, refetch } = useGetEvents()
  const { leaderboards, error: leaderboardError, isLoading: leaderboardLoading } = useGetLeaderboards()
  
  if (isLoading) return (
    <section className="py-24 bg-gradient-to-br from-surface-800 to-surface-900">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="mt-4 text-surface-300">{t("loading")}</p>
      </div>
    </section>
  )
  
  if (error) return (
    <section className="py-24 bg-gradient-to-br from-surface-800 to-surface-900">
      <div className="container mx-auto px-4 text-center">
        <div className="text-warning-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
        </div>
        <p className="text-xl text-surface-300">{t("errorLoading")}: {error}</p>
        <Button onClick={refetch} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white">
          {t("retry")}
        </Button>
      </div>
    </section>
  )

  // Filter for upcoming events
  const upcomingEvents = events
    .filter(event => new Date(event.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)

  // Get top players from the global leaderboards
  const topPlayers = leaderboards && Array.isArray(leaderboards)
    ? [...leaderboards].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 3) as LeaderboardEntry[]
    : []

  return (
    <section className="py-24 bg-gradient-to-br from-surface-800 to-surface-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-surface-50">{t("upcomingEvents")}</h2>
          <p className="text-xl text-surface-300">{t("participateDescription")}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-surface-800">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-6 w-6 text-primary-500" />
                <span className="text-lg font-semibold text-primary-500">{t("activeEvents")}</span>
              </div>
              <CardTitle className="text-2xl text-surface-50">{t("eventCalendar")}</CardTitle>
              <CardDescription className="text-surface-300">
                {t("dontMissEvents")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate);
                    const formattedStartDate = startDate.toLocaleTimeString(t("locale"), {day: '2-digit', month: 'short'});
                    const formattedEndDate = endDate.toLocaleTimeString(t("locale"), {day: '2-digit', month: 'short'});
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-surface-700 hover:bg-surface-600 transition-colors duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <Calendar className="h-8 w-8 text-primary-500" />
                          <div>
                            <h4 className="font-semibold text-lg text-surface-50">{event.title}</h4>
                            <p className="text-surface-300">
                              {formattedStartDate} {event.endDate != event.startDate && `- ${formattedEndDate}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{event.type === 'event' ? t("eventType") : t("serverType")}</Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-300">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-surface-500 opacity-50" />
                  <p>{t("noUpcomingEvents")}</p>
                </div>
              )}
              
              <InternalLink 
                href="/events"
                className="inline-block w-full text-center py-2 px-4 rounded-md bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors mt-6"
              >
                {t("viewAllEvents")}
              </InternalLink>
            </CardContent>
          </Card>
          
          <Card className="bg-surface-800">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-6 w-6 text-primary-500" />
                <span className="text-lg font-semibold text-primary-500">{t("community")}</span>
              </div>
              <CardTitle className="text-2xl text-surface-50">{t("playerRanking")}</CardTitle>
              <CardDescription className="text-surface-300">
                {t("bestPlayers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : leaderboardError ? (
                <div className="text-center py-8 text-surface-300">
                  <p>{t("errorLoadingRanking")}</p>
                </div>
              ) : topPlayers.length > 0 ? (
                <div className="space-y-4">
                  {topPlayers.map((player, index) => (
                    <div 
                      key={player.userId || index}
                      className="flex items-center justify-between p-4 rounded-lg bg-surface-700"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-2xl text-primary-500">#{index + 1}</span>
                        <div>
                          <h4 className="font-semibold text-lg text-surface-50">
                            {player.username || t("playerPlaceholder", {id: player.userId})}
                          </h4>
                          <p className="text-surface-300">{player.totalPoints?.toLocaleString() || 0} {t("points")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Medal className="h-5 w-5 text-primary-500" />
                          <span className="text-lg font-semibold text-surface-50">{player.medalCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-warning-500" />
                          <span className="text-lg font-semibold text-surface-50">{player.achievementCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-300">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-surface-500 opacity-50" />
                  <p>{t("noRankingAvailable")}</p>
                </div>
              )}
              
              <InternalLink
                href="/leaderboard"
                className="inline-block w-full text-center py-2 px-4 rounded-md border border-primary-500 text-primary-500 hover:bg-primary-500/10 font-medium transition-colors mt-6"
              >
                {t("viewFullRanking")}
              </InternalLink>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}