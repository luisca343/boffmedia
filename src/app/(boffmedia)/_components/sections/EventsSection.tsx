"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Calendar, Medal, Trophy, Users, ArrowRight, Clock, Star } from "lucide-react"
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
    <section className="relative py-24 bg-gradient-to-br from-surface-950 via-purple-950/20 to-surface-950 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <div className="absolute top-2 left-2 animate-spin rounded-full h-12 w-12 border-t-2 border-l-2 border-cyan-400"></div>
          </div>
        </div>
        <p className="text-xl text-surface-300 font-medium">{t("loading")}</p>
      </div>
    </section>
  )
  
  if (error) return (
    <section className="relative py-24 bg-gradient-to-br from-surface-950 via-red-950/20 to-surface-950 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-yellow-500/5"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl"></div>
            <div className="relative bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-full p-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <path d="M12 9v4"></path>
                <path d="M12 17h.01"></path>
              </svg>
            </div>
          </div>
        </div>
        <p className="text-xl text-surface-300 mb-6">{t("errorLoading")}: {error}</p>
        <Button 
          onClick={refetch} 
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-semibold shadow-xl transition-all duration-200 hover:scale-105"
        >
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
    <section className="relative py-24 bg-gradient-to-b from-surface-950 via-purple-950/10 to-surface-950 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-4 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent flex-1 max-w-32"></div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-4">
                <Calendar className="h-10 w-10 text-blue-400" />
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent flex-1 max-w-32"></div>
          </div>
          
          <h2 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 leading-tight">
            {t("upcomingEvents")}
          </h2>
          <p className="text-2xl text-surface-300 max-w-3xl mx-auto leading-relaxed">
            {t("participateDescription")}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Events Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-surface-800/80 to-surface-900/80 backdrop-blur-lg border border-surface-700/50 rounded-3xl p-8 hover:border-blue-500/30 transition-all duration-500 shadow-2xl">
              {/* Card Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Trophy className="relative h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-xl font-bold text-blue-400">{t("activeEvents")}</span>
                </div>
                <h3 className="text-3xl font-bold text-surface-50 mb-3 group-hover:text-blue-300 transition-colors duration-300">
                  {t("eventCalendar")}
                </h3>
                <p className="text-lg text-surface-300 leading-relaxed">
                  {t("dontMissEvents")}
                </p>
              </div>

              {/* Events List */}
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4 mb-8">
                  {upcomingEvents.map((event, index) => {
                    const startDate = new Date(event.startDate);
                    const endDate = new Date(event.endDate!);
                    const formattedStartDate = startDate.toLocaleDateString(t("locale"), {day: '2-digit', month: 'short'});
                    const formattedEndDate = endDate.toLocaleDateString(t("locale"), {day: '2-digit', month: 'short'});

                    return (
                      <div
                        key={event.id}
                        className="group/item relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-700/30 to-surface-800/30 backdrop-blur-sm border border-surface-600/30 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {event.icon ? (
                                <div className="relative">
                                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md"></div>
                                  <img 
                                    src={event.icon} 
                                    alt={event.title} 
                                    className="relative h-14 w-14 rounded-full object-cover border-2 border-blue-400/40 group-hover/item:border-blue-400/60 transition-colors duration-300" 
                                  />
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md"></div>
                                  <Calendar className="relative h-10 w-10 text-blue-400 p-2 bg-blue-500/10 rounded-xl"/>
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse shadow-lg"></div>
                            </div>
                            <div>
                              <h4 className="font-bold text-xl text-surface-50 group-hover/item:text-blue-300 transition-colors duration-300">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-4 w-4 text-surface-400" />
                                <p className="text-surface-300 font-medium">
                                  {formattedStartDate} {event.endDate !== event.startDate && `- ${formattedEndDate}`}
                                </p>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30 font-semibold px-3 py-1">
                            {event.type === 'event' ? t("eventType") : t("serverType")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 mb-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-surface-500/10 rounded-full blur-2xl"></div>
                    <Calendar className="relative h-16 w-16 mx-auto text-surface-500 opacity-50" />
                  </div>
                  <p className="text-xl text-surface-400">{t("noUpcomingEvents")}</p>
                </div>
              )}
              
              {/* CTA Button */}
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-blue-500/30 group/btn"
                asChild
              >
                <InternalLink href="/events" className="flex items-center justify-center gap-3">
                  <span>{t("viewAllEvents")}</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </InternalLink>
              </Button>
            </div>
          </div>
          
          {/* Leaderboard Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="relative bg-gradient-to-br from-surface-800/80 to-surface-900/80 backdrop-blur-lg border border-surface-700/50 rounded-3xl p-8 hover:border-purple-500/30 transition-all duration-500 shadow-2xl">
              {/* Card Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Users className="relative h-8 w-8 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-xl font-bold text-purple-400">{t("community")}</span>
                </div>
                <h3 className="text-3xl font-bold text-surface-50 mb-3 group-hover:text-purple-300 transition-colors duration-300">
                  {t("playerRanking")}
                </h3>
                <p className="text-lg text-surface-300 leading-relaxed">
                  {t("bestPlayers")}
                </p>
              </div>

              {/* Leaderboard Content */}
              {leaderboardLoading ? (
                <div className="flex justify-center py-12 mb-8">
                  <div className="relative">
                    <div className="animate-spin h-12 w-12 border-2 border-purple-500/30 rounded-full border-t-purple-500"></div>
                    <div className="absolute top-2 left-2 animate-spin h-8 w-8 border-2 border-pink-400/50 rounded-full border-t-pink-400"></div>
                  </div>
                </div>
              ) : leaderboardError ? (
                <div className="text-center py-12 mb-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/10 rounded-full blur-2xl"></div>
                    <Trophy className="relative h-16 w-16 mx-auto text-red-400 opacity-50" />
                  </div>
                  <p className="text-xl text-surface-400">{t("errorLoadingRanking")}</p>
                </div>
              ) : topPlayers.length > 0 ? (
                <div className="space-y-4 mb-8 roboto-mono">
                  {topPlayers.map((player, index) => {
                    const rankColors = ['from-yellow-400 to-orange-400', 'from-gray-300 to-gray-400', 'from-orange-400 to-yellow-600'];
                    const bgColors = ['from-yellow-500/10 to-orange-500/10', 'from-gray-400/10 to-gray-500/10', 'from-orange-400/10 to-yellow-500/10'];
                    
                    return (
                      <div
                        key={player.userId || index}
                        className="group/player relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-700/30 to-surface-800/30 backdrop-blur-sm border border-surface-600/30 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-r ${bgColors[index] || 'from-purple-500/5 to-transparent'} opacity-0 group-hover/player:opacity-100 transition-opacity duration-300`}></div>
                        <div className="relative p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className={`absolute inset-0 bg-gradient-to-r ${rankColors[index] || 'from-purple-400 to-pink-400'} rounded-xl blur-lg opacity-60`}></div>
                              <div className={`relative bg-gradient-to-r ${rankColors[index] || 'from-purple-400 to-pink-400'} rounded-xl p-3 font-black text-2xl text-surface-900 min-w-[3rem] text-center`}>
                                #{index + 1}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-xl text-surface-50 group-hover/player:text-purple-300 transition-colors duration-300">
                                {player.nickname || t("playerPlaceholder", {id: player.userId})}
                              </h4>
                              <p className="text-surface-300 font-semibold text-lg">
                                {player.totalPoints?.toLocaleString() || 0} {t("points")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 bg-yellow-500/10 rounded-xl px-3 py-2 border border-yellow-500/20">
                              <Medal className="h-5 w-5 text-yellow-400" />
                              <span className="text-lg font-bold text-surface-50">{player.medalCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-500/10 rounded-xl px-3 py-2 border border-orange-500/20">
                              <Award className="h-5 w-5 text-orange-400" />
                              <span className="text-lg font-bold text-surface-50">{player.achievementCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 mb-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-surface-500/10 rounded-full blur-2xl"></div>
                    <Trophy className="relative h-16 w-16 mx-auto text-surface-500 opacity-50" />
                  </div>
                  <p className="text-xl text-surface-400">{t("noRankingAvailable")}</p>
                </div>
              )}
              
              {/* CTA Button */}
              <Button 
                variant="outline"
                className="w-full border-2 border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400/60 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-purple-500/30 group/btn"
                asChild
              >
                <InternalLink href="/leaderboard" className="flex items-center justify-center gap-3">
                  <span>{t("viewFullRanking")}</span>
                  <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover/btn:translate-x-1" />
                </InternalLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}