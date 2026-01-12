import { useState } from "react";
import { useTranslations } from 'next-intl';
import { Users, Minus, Trophy, Search, XCircle } from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Badge } from "@/components/ui/primitives/badge";
import { SectionHeader } from "@/components/ui/form/FormSectionHeader";
import { Button } from "@/components/ui/primitives/button";

interface ParticipantsListProps {
  participants: string[];
  previousWinners: string[];
  onRemove: (name: string) => void;
}

export function ParticipantsList({ 
  participants, 
  previousWinners,
  onRemove 
}: ParticipantsListProps) {
  const t = useTranslations('boffmedia');
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"participants" | "winners">("participants");
  
  const filteredParticipants = participants.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.localeCompare(b));
  
  return (
    <div className="bg-gradient-to-br from-surface-800/90 to-surface-900/90 border border-surface-700/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm h-full">
      
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <SectionHeader 
          icon={activeTab === "participants" ? <Users className="w-5 h-5" /> : <Trophy className="w-5 h-5" />} 
          title={activeTab === "participants" ? t('giveaway.participants.title') : t('giveaway.participants.winnersTitle')} 
        />
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab("participants")}
           variant={activeTab === "participants" ? "default" : "ghost"}
            title={t('giveaway.participants.tooltips.viewParticipants')}
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setActiveTab("winners")}
            variant={activeTab === "winners" ? "default" : "ghost"}
            title={t('giveaway.participants.tooltips.viewWinners')}
          >
            <Trophy className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
        <Input
          placeholder={activeTab === "participants" ? t('giveaway.participants.search.participants') : t('giveaway.participants.search.winners')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-surface-700/50 border-surface-600/50 text-surface-50 placeholder:text-surface-400"
        />
        {searchTerm && (
          <Button 
            onClick={() => setSearchTerm("")}
            variant="ghost"
            size="zero"
            className="absolute right-3 top-2.5 text-surface-400 hover:text-surface-50 transition-colors duration-200"
          >
            <XCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {/* Content */}
      <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "participants" ? (
          <>
            {/* Stats */}
            <div className="flex items-center gap-2 mb-4">
              <Badge 
                variant="secondary" 
                className="bg-orange-500/20 text-orange-300 border-orange-500/30"
              >
                {filteredParticipants.length} {t('giveaway.participants.stats.of')} {participants.length}
              </Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-surface-400 border-surface-600">
                  {t('giveaway.participants.stats.filtered', { term: searchTerm })}
                </Badge>
              )}
            </div>

            {/* Participants List */}
            {filteredParticipants.length > 0 ? (
              <div className="space-y-2">
                {filteredParticipants.map((name, index) => (
                  <div 
                    key={name}
                    className="group flex items-center justify-between p-4 bg-surface-700/30 hover:bg-surface-600/50 rounded-xl border border-surface-600/30 hover:border-surface-500/50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-surface-50 font-medium truncate">{name}</span>
                    </div>
                    <Button 
                      onClick={() => onRemove(name)}
                      variant="ghost"
                      size="zero"
                      className="text-surface-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all duration-200 p-2 rounded-lg hover:bg-red-500/10"
                      title={t('giveaway.participants.tooltips.remove', { name })}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-center">
                <div className="w-16 h-16 bg-surface-700/50 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-surface-400" />
                </div>
                {searchTerm ? (
                  <div>
                    <p className="text-surface-400 mb-2">{t('giveaway.participants.empty.noResults')}</p>
                    <p className="text-sm text-surface-500">{t('giveaway.participants.empty.noMatch', { term: searchTerm })}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-surface-400 mb-2">{t('giveaway.participants.empty.noParticipants')}</p>
                    <p className="text-sm text-surface-500">{t('giveaway.participants.empty.addParticipants')}</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Winners Stats */}
            <div className="flex items-center gap-2 mb-4">
              <Badge 
                variant="secondary" 
                className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
              >
                {t('giveaway.participants.stats.winners', { count: previousWinners.length })}
              </Badge>
            </div>

            {/* Winners List */}
            {previousWinners.length > 0 ? (
              <div className="space-y-2">
                {previousWinners.map((name, index) => (
                  <div 
                    key={`${name}-${index}`}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-yellow-100 font-medium">{name}</span>
                    <Badge variant="outline" className="ml-auto text-xs text-yellow-400 border-yellow-500/30">
                      Ganador #{index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-center">
                <div className="w-16 h-16 bg-surface-700/50 rounded-2xl flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-surface-400" />
                </div>
                <p className="text-surface-400 mb-2">{t('giveaway.participants.empty.noWinners')}</p>
                <p className="text-sm text-surface-500">{t('giveaway.participants.empty.winnersInfo')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}