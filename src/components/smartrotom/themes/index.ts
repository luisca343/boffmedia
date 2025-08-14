// Platform-specific theme configuration
export interface PlatformTheme {
  primary: string;
  secondary: string;
  accent: string;
  hover: string;
  name: string;
}

export const themes: Record<string, PlatformTheme> = {
  youtube: {
    primary: "red-500",
    secondary: "red-600", 
    accent: "red-400",
    hover: "red-500",
    name: "YouTube"
  },
  twitch: {
    primary: "purple-500",
    secondary: "purple-600",
    accent: "purple-400", 
    hover: "purple-500",
    name: "Twitch"
  }
};

export const getTheme = (platform: keyof typeof themes): PlatformTheme => {
  return themes[platform] || themes.youtube;
};
