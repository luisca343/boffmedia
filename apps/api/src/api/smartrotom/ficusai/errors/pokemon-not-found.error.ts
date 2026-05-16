export class PokemonNotFoundError extends Error {
  constructor(
    public readonly pokemonName: string,
    public readonly similarPokemon: string[],
  ) {
    super(`Pokemon ${pokemonName} not found`);
    this.name = 'PokemonNotFoundError';
  }
}
