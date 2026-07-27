'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { WingullService } from '@/services/api/smartrotom/wingullService';
import type { TownData, Amenity, Property } from './types';
import { AmenitiesSection } from './_components/amenities/AmenitiesSection';
import { TownMapSection } from './_components/map/TownMapSection';
import { PropertiesSection } from './_components/properties/PropertiesSection';
import { BusinessSection } from './_components/properties/BusinessSection';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HeroSection } from './_components/sections/HeroSection';


function LoadingScreen() {
  const t = useTranslations('wingull.town');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-ink">{t('loading')}</h2>
        <p className="text-ink">{t('loadingSub')}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  const t = useTranslations('wingull.town');

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-ink">{t('errorTitle')}</h2>
        <p className='text-ink'>{error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}

export default function TownRealEstatePage() {
  const t = useTranslations('wingull.town');
  const params = useParams();
  const pueblo = Array.isArray(params.pueblo) ? params.pueblo[0] : params.pueblo;
  const [townData, setTownData] = useState<TownData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const fetchTownData = async () => {
    if (!pueblo) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await WingullService.getTownInfo(pueblo);
      setTownData(response.data);
    } catch (error) {
      console.error('Error fetching town data:', error);
      setError(t('fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTownData();
  }, [pueblo]);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!pueblo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold text-white">{t('missingTitle')}</h2>
          <p className="text-gray-400">{t('missingBody')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen error={error} onRetry={fetchTownData} />;
  }

  if (!townData) {
    return <ErrorScreen error={t('noData')} onRetry={fetchTownData} />;
  }

  return (
    <div className="min-h-screen">
      <HeroSection 
        townName={pueblo} 
        townData={townData} 
        onScrollToContent={scrollToContent} 
      />
      <div ref={contentRef}>
        <AmenitiesSection townData={townData} townName={pueblo} />
        <PropertiesSection townData={townData} townName={pueblo} />
        <BusinessSection townData={townData} townName={pueblo} />
        <TownMapSection townData={townData} townName={pueblo} />
      </div>
    </div>
  );
}