import type { CommandContext, SlashCreator } from "slash-create";
import { ApplicationCommandType, SlashCommand } from "slash-create";
import { formatPokemonSearch, loadPokemon, searchPokemon, searchPokemonLooseExclusive } from "../dehint";

let pokemon: string[] | null = null;

export default class DehintMessage extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "Dehint",
      type: ApplicationCommandType.MESSAGE,
    });
  }

  async run(ctx: CommandContext) {
    if (pokemon === null) {
      pokemon = await loadPokemon();
    }

    const message = ctx.targetMessage?.content;

    if (!message) {
      return "what";
    }

    const query = message.match(/^The pokémon is (.*)\.$/)?.[1] ?? message;

    const matches = searchPokemon(pokemon, query);
    const looseMatches = searchPokemonLooseExclusive(pokemon, query);

    return formatPokemonSearch(matches, looseMatches);
  }
}
