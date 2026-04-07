"use client";

import { useTranslations } from "next-intl";

interface ProfileHeaderProps {
  displayName: string;
  profileImageUrl: string;
  description?: string;
}

export const ProfileHeader = ({ displayName, profileImageUrl, description }: ProfileHeaderProps) => {
  const t = useTranslations("twitch");
  return (
    <div className="flex items-center space-x-4 p-4 bg-surface-900 rounded-lg shadow">
      <img
        src={profileImageUrl}
        alt={displayName}
        className="w-20 h-20 rounded-full border-4 border-purple-500 object-cover"
      />
      <div>
        <h2 className="text-2xl font-bold text-purple-400">{displayName}</h2>
        {description && <p className="text-surface-300 mt-2">{description}</p>}
      </div>
    </div>
  );
};
