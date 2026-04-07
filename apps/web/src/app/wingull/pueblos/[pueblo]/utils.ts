import { LuHeartPulse, LuMapPin, LuParkingMeter, LuStore, LuWarehouse, LuSwords, LuGamepad2 } from "react-icons/lu";

export function getIconComponent(iconName: string) {
  const icons: { [key: string]: React.ComponentType<any> } = {
    'store': LuStore,
    'warehouse': LuWarehouse,
    'parking': LuParkingMeter,
    'pokemon_center': LuHeartPulse,
    'community_storage': LuWarehouse,
    'battle_field': LuSwords,
    'pokemon_gym': LuGamepad2
  };
  return icons[iconName] || LuMapPin;
}