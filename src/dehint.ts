import { readFile } from "fs/promises";
import path from "path";

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\ufe0f\\]/g, "")
    .trim();

export const loadPokemon = async (): Promise<string[]> => {
  const raw = await readFile(path.resolve("src", "pokemon.txt"), "utf-8");
  return raw
    .toString()
    .split("\n")
    .filter((line) => line.length > 0)
    .map(normalize);
};

export const searchPokemon = (pokemon: string[], query: string): string[] => {
  console.log("before", "'" + query + "'", query.length);
  query = normalize(query);

  console.log("after", "'" + query + "'", query.length);

  return pokemon.filter((poke) => {
    if (poke.length !== query.length) return false;

    for (let i = 0; i < query.length; i++) {
      if (query[i] !== "_" && query[i] !== poke[i]) return false;
    }
    return true;
  });
};

export const searchPokemonLooseExclusive = (pokemon: string[], query: string): string[] => {
  const subqueries = normalize(query).split(" ");
  if (subqueries.length === 1) return [];

  return pokemon.filter((poke) =>
    subqueries.some((sq) => {
      if (poke.length !== sq.length) return false;

      for (let i = 0; i < sq.length; i++) {
        if (sq[i] !== "_" && sq[i] !== poke[i]) return false;
      }
      return true;
    }),
  );
};

export const formatPokemonSearch = (matches: string[], looseMatches: string[]): string => {
  if (matches.length === 0 && looseMatches.length === 0) {
    return "No Pokémon matched that search";
  }

  const backtick = "`";

  const matchesString = `Found ${matches.length} Pokémon:\n${matches.map((s) => backtick + s + backtick).join("\n")}`;
  const looseMatchesString = `Found ${looseMatches.length} Pokémon (loosely):\n${looseMatches
    .map((s) => backtick + s + backtick)
    .join("\n")}`;
  return [matches.length ? matchesString : "", looseMatches.length ? looseMatchesString : ""]
    .filter((str) => str.length > 0)
    .join("\n\n");
};
