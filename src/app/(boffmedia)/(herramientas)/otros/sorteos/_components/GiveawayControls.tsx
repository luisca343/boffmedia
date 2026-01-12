import { useState } from "react";
import { useTranslations } from 'next-intl';
import { UserPlus, Upload, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Card } from "@/components/ui/primitives/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { SectionHeader } from "@/components/ui/form/FormSectionHeader";

interface GiveawayControlsProps {
  onAddParticipant: (name: string) => void;
  onUploadList: (list: string[]) => void;
  onStartGiveaway: () => void;
  participantCount: number;
}

export function GiveawayControls({
  onAddParticipant,
  onUploadList,
  onStartGiveaway,
  participantCount
}: GiveawayControlsProps) {
  const t = useTranslations('boffmedia');
  const [newParticipant, setNewParticipant] = useState("");
  const [participantList, setParticipantList] = useState("");
  const [activeTab, setActiveTab] = useState("single");
  
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipant.trim()) {
      onAddParticipant(newParticipant.trim());
      setNewParticipant("");
    }
  };
  
  const handleUploadList = () => {
    const names = participantList
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
    
    if (names.length > 0) {
      onUploadList(names);
      setParticipantList("");
    }
  };
  
  return (
    <Card className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface-800/90 to-surface-900/90 border-surface-700/50 backdrop-blur-sm shadow-2xl">
      
      {/* Header */}
      <div className="mb-8">
        <SectionHeader 
          icon={<UserPlus className="w-5 h-5" />} 
          title={t('giveaway.controls.title')} 
        />
        <p className="text-surface-400 mt-2">
          {t('giveaway.controls.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-surface-700/50 border border-surface-600/50">
            <TabsTrigger 
              value="single" 
              className="data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
            >
              <UserPlus className="mr-2 w-4 h-4" />
              {t('giveaway.controls.tabs.single')}
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="data-[state=active]:bg-primary-500 data-[state=active]:text-white transition-all duration-200"
            >
              <Upload className="mr-2 w-4 h-4" />
              {t('giveaway.controls.tabs.list')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-6">
            <form onSubmit={handleAddSingle} className="flex gap-3">
              <Input
                placeholder={t('giveaway.controls.placeholders.participantName')}
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                className="bg-surface-700/50 border-surface-600/50 text-surface-50 placeholder:text-surface-400 hover:bg-surface-700 focus:border-primary-500/50 transition-all duration-200"
              />
              <Button 
                type="submit" 
                variant="default"
              >
                {t('giveaway.controls.buttons.add')}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="list" className="mt-6 space-y-4">
            <Textarea
              placeholder={t('giveaway.controls.placeholders.participantList')}
              value={participantList}
              onChange={(e) => setParticipantList(e.target.value)}
              rows={6}
              className="bg-surface-700/50 border-surface-600/50 text-surface-50 placeholder:text-surface-400 hover:bg-surface-700 focus:border-primary-500/50 transition-all duration-200 resize-none"
            />
            <Button 
              onClick={handleUploadList}
              disabled={!participantList.trim()}
              className="w-full"
              variant="default"
            >
              <Upload className="mr-2 w-4 h-4" />
              {t('giveaway.controls.buttons.uploadList', { count: participantList.split('\n').filter(Boolean).length })}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
        
      {/* Warning */}
      {participantCount === 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl mb-6">
          <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">{t('giveaway.controls.warning.title')}</p>
            <p className="text-sm text-amber-400/80">{t('giveaway.controls.warning.description')}</p>
          </div>
        </div>
      )}
      
      {/* Status */}
      <div className="text-center py-6 px-4 bg-surface-700/30 rounded-xl border border-surface-600/30 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${participantCount > 0 ? 'bg-highlight-400' : 'bg-surface-500'} transition-colors duration-200`} />
          <p className="text-surface-300 font-medium">
            {participantCount === 0 
              ? t('giveaway.controls.status.noParticipants')
              : t('giveaway.controls.status.participantsReady', { count: participantCount })
            }
          </p>
        </div>
        {participantCount > 0 && (
          <p className="text-sm text-surface-400">
            {t('giveaway.controls.status.selectionInfo')}
          </p>
        )}
      </div>

      <Button
        onClick={onStartGiveaway}
        variant="secondary"
        disabled={participantCount === 0}
        className="w-full h-12 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {participantCount === 0 ? t('giveaway.controls.buttons.addParticipants') : `🎲 ${t('giveaway.controls.buttons.startGiveaway')}`}
      </Button>
    </Card>
  );
}