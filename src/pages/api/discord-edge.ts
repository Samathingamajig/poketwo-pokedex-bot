import type { NextRequest } from "next/server.js";
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
  data: z
    .object({
      options: z.array(z.any()).default(() => []),
    })
    .default(() => ({})),
});

// The main logic of the Discord Slash Command is defined in this function.
export default async function discordEdge(req: NextRequest) {
  if (req.method?.toUpperCase() !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  if (!req.headers.get("x-signature-ed25519") || !req.headers.get("x-signature-timestamp")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  // verifySignature() verifies if the request is coming from Discord.
  // When the request's signature is not valid, we return a 401 and this is
  // important as Discord sends invalid requests to test our verification.
  console.log("verifying signature");
  const { valid, body } = await verifySignature(req);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "content-type": "application/json",
      },
    });
  }

  console.log("parsing body");
  const { type, data } = discordInteractionSchema.parse(JSON.parse(body));
  console.log("type", type);
  console.log("data", data);
  // Discord performs Ping interactions to test our application.
  // Type 1 in a request implies a Ping interaction.
  if (type === InteractionType.Ping) {
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.Pong,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  // Type 2 in a request is an ApplicationCommand interaction.
  // It implies that a user has issued a command.
  if (type === InteractionType.ApplicationCommand) {
    console.log(data);
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Hello, world!",
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      },
    );
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
  return new Response(JSON.stringify({ error: "Bad request" }), {
    status: 400,
    headers: {
      "content-type": "application/json",
    },
  });
}

/** Verify whether the request is coming from Discord. */
async function verifySignature(request: NextRequest): Promise<{ valid: boolean; body: string }> {
  const PUBLIC_KEY = env.DISCORD_APPLICATION_PUBLIC_KEY;
  // Discord sends these headers with every request.
  const signature = request.headers.get("X-Signature-Ed25519") ?? "";
  const timestamp = request.headers.get("X-Signature-Timestamp") ?? "";
  console.log("getting body as text");
  const body = await request.text();
  console.log("sign.detached.verify");
  const valid = sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY),
  );
  console.log("is valid?", valid);

  return { valid, body };
}

/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
  return new Uint8Array((hex.match(/.{1,2}/g) ?? []).map((val) => parseInt(val, 16)));
}
