import { env } from "../../env/server.mjs";
import dehintSlash from "../../commands/dehintSlash";
import dehintMessage from "../../commands/dehintMessage";

import { SlashCreator, VercelServer } from "slash-create";

export const creator = new SlashCreator({
  applicationID: env.DISCORD_APPLICATION_ID,
  publicKey: env.DISCORD_APPLICATION_PUBLIC_KEY,
  token: env.DISCORD_BOT_TOKEN,
});

creator.withServer(new VercelServer()).registerCommands([dehintSlash, dehintMessage]);

creator.on("warn", (message) => console.warn(message));
creator.on("error", (error) => console.error(error));
creator.on("commandRun", (command, _, ctx) =>
  console.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`),
);
creator.on("commandError", (command, error) => console.error(`Command ${command.commandName}:`, error));

export default (creator.server as VercelServer).vercelEndpoint;

// const reqSchema = z.object({
//   type: z.number(),
// });

// const isVerified = (req: NextApiRequest, rawBody: string) => {
//   const signature = req.headers["X-Signature-Ed25519"] as string;
//   const timestamp = req.headers["X-Signature-Timestamp"] as string;

//   return nacl.sign.detached.verify(
//     Buffer.from(timestamp + rawBody), //
//     Buffer.from(signature, "hex"),
//     Buffer.from(env.DISCORD_APPLICATION_PUBLIC_KEY),
//   );
// };

// const handler = (async (req, res) => {
//   const rawBody = (await getRawBody(req)).toString("utf-8");
//   console.log("amogus", rawBody, "amogus");
//   console.log(rawBody.length);
//   console.log(`"${rawBody}"`);
//   const reqJson = reqSchema.parse(JSON.parse(rawBody));
//   if (reqJson.type === InteractionType.Ping) {
//     return res.status(200).send({
//       type: InteractionResponseType.Pong,
//     });
//   }

//   if (!isVerified(req, rawBody)) {
//     return res.status(401).end("invalid request signature");
//   }

//   return res.status(200).send({
//     type: InteractionResponseType.Pong,
//   });
// }) satisfies NextApiHandler;

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export default handler;
