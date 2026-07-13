import { HeartPulse, MapPin, ParkingMeter, Store, Warehouse, Swords, Gamepad2 } from "lucide-react";

export function getIconComponent(iconName: string) {
  const icons: { [key: string]: React.ComponentType<any> } = {
    'store': Store,
    'warehouse': Warehouse,
    'parking': ParkingMeter,
    'pokemon_center': HeartPulse,
    'community_storage': Warehouse,
    'battle_field': Swords,
    'pokemon_gym': Gamepad2
  };
  return icons[iconName] || MapPin;
}
