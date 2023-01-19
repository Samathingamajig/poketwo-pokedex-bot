import type { SlashCreator, CommandContext } from "slash-create";
import { SlashCommand, CommandOptionType } from "slash-create";
import { formatPokemonSearch, loadPokemon, searchPokemon, searchPokemonLooseExclusive } from "../dehint";

let pokemon: string[] | null = null;

export default class DehintCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "dehint",
      description: "Deobfuscates Pokétwo's hints to allow for easier catching",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "hint",
          description: "Obfuscated Pokémon name",
          required: true,
        },
      ],
    });
  }

  async run(ctx: CommandContext) {
    if (pokemon === null) {
      pokemon = await loadPokemon();
    }

    const matches = searchPokemon(pokemon, ctx.options.hint as string);
    const looseMatches = searchPokemonLooseExclusive(pokemon, ctx.options.hint as string);
    return formatPokemonSearch(matches, looseMatches);
  }
}
