"use client";

import { useState, useEffect } from "react";
import { InternalLink } from "@/components/nav/Link";
import { LoadingSpinner } from "../../_components/LoadingSpinner";
import { TwitchClipPlayer } from "../_components/TwitchClipPlayer";
import { ClipDetails } from "../_components/ClipDetails";
import { TwitchClip } from "../../types";
import { twitchAPI } from "../../_services/twitchAPI";
import { addToHistory } from "../../_services/historyService";
import { useTranslations } from "next-intl";

export default function ClipPage({ params }: { params: { id: string } }) {
  const t = useTranslations("twitch");
  const [clipData, setClipData] = useState<TwitchClip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClipData() {
      try {
        setLoading(true);
        setError(null);
        
        // Get clip data from Twitch API
        const clip = await twitchAPI.getClipById(params.id);
        
        if (clip) {
          setClipData(clip);
          // Add to watch history
          addToHistory(clip, 'clip');
        } else {
          setError(t("clip.notFound"));
        }
      } catch (error) {
        console.error("Error fetching clip data:", error);
        setError(t("clip.notFound"));
      } finally {
        setLoading(false);
      }
    }
    
    fetchClipData();
  }, [params.id, t]);

  if (loading) {
    return (
      <div className="min-h-full bg-surface-900 flex justify-center items-center overflow-auto">
        <LoadingSpinner size="large" message={t("loading.clip")} />
      </div>
    );
  }

  if (error || !clipData) {
    return (
      <div className="min-h-full bg-surface-900 text-white p-6 flex justify-center items-center overflow-auto">
        <div className="bg-surface-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
          <p className="text-red-500 text-xl mb-4">{error || t("clip.notFound")}</p>
          <InternalLink href="twitch" className="text-purple-400 hover:underline">
            {t("clip.returnToBrowse")}
          </InternalLink>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-surface-900 text-white overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <TwitchClipPlayer 
            clipId={params.id}
            height={500}
          />
        </div>

        <ClipDetails
          title={clipData.title}
          broadcasterName={clipData.broadcaster_name}
          creatorName={clipData.creator_name}
          viewCount={clipData.view_count}
          duration={clipData.duration}
          createdAt={clipData.created_at}
          language={clipData.language}
        />
      </div>
    </div>
  );
}
