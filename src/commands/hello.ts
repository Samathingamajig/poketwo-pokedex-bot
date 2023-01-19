import type { SlashCreator, CommandContext } from "slash-create";
import { SlashCommand, CommandOptionType } from "slash-create";

export default class HelloCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: "hello",
      description: "Says hello to you.",
      options: [
        {
          type: CommandOptionType.STRING,
          name: "food",
          description: "What food do you like?",
        },
      ],
    });
  }

  run(ctx: CommandContext) {
    return Promise.resolve(
      ctx.options.food
        ? `You like ${ctx.options.food as string}? Nice!`
        : `Hello, ${ctx.member?.displayName ?? ctx.user.username}!`,
    );
  }
}
