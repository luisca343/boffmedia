export type Mensaje = {
  sender: "user" | "bot";
  parts: MessagePart[];
};

export type MessagePart = {
  type: "text" | "pokemonStats" | "pokemonMoves" | "biomeList" | "pokemonTypes" | "pokemonHabitat";
  content: string | PokemonStats | any;
};

export type PokemonStats = {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
};
