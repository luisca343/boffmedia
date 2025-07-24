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
import { FloatingSection } from "../layout/FloatingSection"

export function EventsSection() {
  const t = useTranslations("boffmedia.eventsSection");
  const { events, error, isLoading, refetch } = useGetEvents()
  const { leaderboards, error: leaderboardError, isLoading: leaderboardLoading } = useGetLeaderboards()
  
  if (isLoading) return (
    <section className="relative py-24 bg-gradient-to-br from-surface-950 via-purple-950/30 to-surface-950">
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="mt-4 text-surface-300">{t("loading")}</p>
      </div>
    </section>
  )
  
  if (error) return (
    <section className="relative py-24 bg-gradient-to-br from-surface-950 via-purple-950/30 to-surface-950">
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
    //.filter(event => new Date(event.endDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5)

  // Get top players from the global leaderboards
  const topPlayers = leaderboards && Array.isArray(leaderboards)
    ? [...leaderboards].sort((a: any, b: any) => b.totalPoints - a.totalPoints).slice(0, 3) as any[]
    : []

  return (
    <FloatingSection 
      mainPage={true}
      variant="cool"
      className="relative py-32 bg-gradient-to-br from-surface-950 via-blue-950/20 to-purple-950/30 overflow-hidden wave-svg-like-both"
    >
      <div className="relative container mx-auto px-4 z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent flex-1"></div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg"></div>
              <Calendar className="relative h-8 w-8 text-blue-400" />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent flex-1"></div>
          </div>
          <h2 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
            {t("upcomingEvents")}
          </h2>
          <p className="text-xl text-surface-300 max-w-2xl mx-auto">{t("participateDescription")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="group bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-600 hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <Trophy className="h-6 w-6 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-lg font-semibold text-blue-400">{t("activeEvents")}</span>
              </div>
              <CardTitle className="text-2xl text-surface-50 group-hover:text-blue-300 transition-colors duration-300">
                {t("eventCalendar")}
              </CardTitle>
              <CardDescription className="text-surface-300">
                {t("dontMissEvents")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event, index) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate!);
                    const formattedStartDate = startDate.toLocaleDateString(t("locale"), {day: '2-digit', month: 'short'});
                    const formattedEndDate = endDate.toLocaleDateString(t("locale"), {day: '2-digit', month: 'short'});
                    
                    console.log(`Rendering event: ${event.title} (${formattedStartDate} - ${formattedEndDate})`);

                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-surface-700/50 hover:bg-surface-600/70 transition-all duration-300 border border-transparent hover:border-blue-500/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            { event.icon ? 
                              <img src={event.icon} alt={event.title} className="h-12 w-12 rounded-full object-cover border-2 border-blue-400/30" /> : 
                              <Calendar className="h-8 w-8 text-blue-400"/>
                            }
                            
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full animate-pulse"></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg text-surface-50">{event.title}</h4>
                            <p className="text-surface-300">
                              {formattedStartDate} {event.endDate !== event.startDate && `- ${formattedEndDate}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {event.type === 'event' ? t("eventType") : t("serverType")}
                        </Badge>
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
                className="inline-block w-full text-center py-3 px-4 rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium transition-all duration-300 mt-6 hover:shadow-lg hover:shadow-blue-500/30"
              >
                {t("viewAllEvents")}
              </InternalLink>
            </CardContent>
          </Card>
          
          <Card className="group bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-600 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <Users className="h-6 w-6 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="text-lg font-semibold text-purple-400">{t("community")}</span>
              </div>
              <CardTitle className="text-2xl text-surface-50 group-hover:text-purple-300 transition-colors duration-300">
                {t("playerRanking")}
              </CardTitle>
              <CardDescription className="text-surface-300">
                {t("bestPlayers")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-purple-500 rounded-full border-t-transparent"></div>
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
                      className="flex items-center justify-between p-4 rounded-lg bg-surface-700/50 hover:bg-surface-600/70 transition-all duration-300 border border-transparent hover:border-purple-500/30 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <span className="font-bold text-2xl text-purple-400">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-surface-50">
                            {player.nickname || t("playerPlaceholder", {id: player.userId})}
                          </h4>
                          <p className="text-surface-300">{player.totalPoints?.toLocaleString() || 0} {t("points")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Medal className="h-5 w-5 text-yellow-400" />
                          <span className="text-lg font-semibold text-surface-50">{player.medalCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-5 w-5 text-orange-400" />
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
                className="inline-block w-full text-center py-3 px-4 rounded-md border border-purple-500 text-purple-300 hover:bg-purple-500/10 font-medium transition-all duration-300 mt-6 hover:shadow-lg hover:shadow-purple-500/30"
              >
                {t("viewFullRanking")}
              </InternalLink>
            </CardContent>
          </Card>
        </div>
      </div>
    </FloatingSection>
  )
}