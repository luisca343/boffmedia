export interface PtcgpData {
    "Main Sets": MainSet[];
    "Promo Sets": PromoSet[];
  }

  export interface CardSet {
    logo: string;
    icon: string;
    setName: string;
    numberOfCards: string;
    releaseDate: string;
    boosterPackList: BoosterPack[];
    cardList: Card[];
    themedCollections: ThemedCollection[];
    emblems: Emblem[];
    soloBattles: SoloBattle[];
    featuredCards: FeaturedCard[];
  }
  
  export interface MainSet extends CardSet {}
  
  export interface PromoSet extends CardSet {}
  
  export interface BoosterPack {
    packName: string;
    image: string;
    fullName: string;
  }
  
  export interface Card {
    cardNumber: number;
    fullNumber: string;
    image: string;
    name: string;
    type: CardType;
    hp: number | null;
    weakness: WeaknessType;
    weaknessValue: number | null;
    retreatCost: number;
    packs: string[];
    rarity: Rarity;
  }
  
  export type CardType = 'grass' | 'fire' | 'water' | 'electric' | 'psychic' | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless' | 'unknown';
  
  export type WeaknessType = 'fire' | 'water' | 'electric' | 'psychic' | 'fighting' | 'grass' | 'darkness' | 'metal' | 'none';
  
  export type Rarity = 'diamond1' | 'diamond2' | 'diamond3' | 'diamond4' | 'star1' | 'star2' | 'star3' | 'crown' | 'promo' | 'unknown';
  
  export interface ThemedCollection {
    picture: string;
    name: string;
    requirements: string[];
    rewards: string[];
  }
  
  export interface Emblem {
    name: string;
    method: string;
  }
  
  export interface SoloBattle {
    name: string;
  }
  
  export interface FeaturedCard {
    name: string;
    image: string;
  }