import { Utensils, Lightbulb, Gamepad2, Syringe, Bath, Activity, MessageCircle, Bell } from 'lucide-react'
import { MenuItem } from './types'

export const INITIAL_TAMAGOTCHI_STATE = {
  hunger: 100,
  happiness: 100,
  health: 100,
  age: 0,
  weight: 5,
  discipline: 0,
  isSick: false,
  isLightOn: true,
  needsCleaning: false,
  isSleeping: false,
};

export const MENU_ITEMS: MenuItem[] = [
  { icon: Utensils, action: "FEED", subMenu: ["MEAL", "SNACK"] },
  { icon: Lightbulb, action: "LIGHT", subMenu: ["ON", "OFF"] },
  { icon: Gamepad2, action: "PLAY" },
  { icon: Syringe, action: "MEDICINE" },
  { icon: Bath, action: "CLEAN" },
  { icon: Activity, action: "HEALTH_METER" },
  { icon: MessageCircle, action: "DISCIPLINE" },
  { icon: Bell, action: "ATTENTION" },
];