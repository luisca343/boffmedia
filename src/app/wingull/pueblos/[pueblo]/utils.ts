import { LuBookOpen, LuDumbbell, LuHeartPulse, LuMapPin, LuMicroscope, LuShield, LuStore } from "react-icons/lu";

export function getIconComponent(iconName: string) {
  const icons: { [key: string]: React.ComponentType<any> } = {
    'heart-pulse': LuHeartPulse,
    'microscope': LuMicroscope,
    'shield': LuShield,
    'store': LuStore,
    'dumbbell': LuDumbbell,
    'book-open': LuBookOpen
  };
  return icons[iconName] || LuMapPin;
}