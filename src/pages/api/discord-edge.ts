import type { NextApiRequest, NextApiResponse } from "next";
import { InteractionResponseType, InteractionType } from "discord-api-types/v10";
import { env } from "../../env/server.mjs";
import { sign } from "tweetnacl";
import { z } from "zod";

export const config = {
  runtime: "edge",
  api: {
    bodyParser: false,
  },
};

const discordInteractionSchema = z.object({
  type: z.number().refine<InteractionType>((val): val is InteractionType => {
    return InteractionType[val] !== undefined;
  }),
  data: z.object({
    options: z.array(z.any()).default(() => []),
  }),
});

// The main logic of the Discord Slash Command is defined in this function.
export default async function DiscordEdge(req: NextApiRequest, res: NextApiResponse) {
  if (req.method?.toUpperCase() !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!req.headers["x-signature-ed25519"] || !req.headers["x-signature-timestamp"]) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  console.log("verifying signature");
  const { valid, body } = await verifySignature(req);
  if (!valid) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("parsing body");
  const { type, data } = discordInteractionSchema.parse(JSON.parse(body));
  console.log("type", type);
  console.log("data", data);
  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === InteractionType.Ping) {
    return res.json({
      type: InteractionResponseType.Pong, // Pong a ping
    });
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === InteractionType.ApplicationCommand) {
    console.log(data);
    return res.json({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Hello, world!",
      },
    });
    // const { value } = data.options.find((option: { name: string; value: string }) => option.name === "name");
    // return json({
    //   // Type 4 responds with the below message retaining the user's
    //   // input at the top.
    //   type: 4,
    //   data: {
    //     content: `Hello, ${value}!`,
    //   },
    // });
  }

  // We will return a bad request error as a valid Discord request
  // shouldn't reach here.
  return res.status(400).json({ error: "Bad request" });
}

/** Verify whether the request is coming from Discord. */
async function verifySignature(request: NextApiRequest): Promise<{ valid: boolean; body: string }> {
  const PUBLIC_KEY = env.DISCORD_APPLICATION_PUBLIC_KEY;
  // Discord sends these headers with every request.
  const signature = request.headers["X-Signature-Ed25519"] as string;
  const timestamp = request.headers["X-Signature-Timestamp"] as string;
  console.log("parsing body");
  const body = await parseRawBodyAsString(request);
  console.log("sign.detached.verify");
  const valid = sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY),
  );

  return { valid, body };
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array((hex.match(/.{1,2}/g) ?? []).map((val) => parseInt(val, 16)));
}

/**
 * Parse body from payload as raw string: https://github.com/vercel/next.js/blob/86160a5190c50ea315c7ba91d77dfb51c42bc65f/test/integration/api-support/pages/api/no-parsing.js
 */
function parseRawBodyAsString(req: NextApiRequest) {
  return new Promise<string>((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      resolve(Buffer.from(data).toString());
    });
  });
}
