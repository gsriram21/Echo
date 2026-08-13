import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are writing the non-speech caption layer for a film, for Deaf and hard-of-hearing viewers. You are looking at two frames from the moment a sound occurs, plus acoustic measurements of that sound.

Answer three questions.

1. What is the sound? One to three words, lowercase. Write the sound itself, not the source. Use onomatopoeia first — the word should make you hear or feel what it describes ("clang", "caw caw", "whoooosh", "crack", "thwack", "crackle", "shhhhh", "boom", "scrape", "clatter", "hisssss"). If onomatopoeia is too generic, use a short sensory descriptor that still evokes the texture and weight of the sound ("a chord lands", "low throb", "steel ring", "deep groan"). Avoid naming the source object or action visually — "clang" not "swords clash", "caw caw" not "bird calls", "crackle" not "fire burns", "whoooosh" not "wings fly". If you can see the source, still write the sound it makes, not what it is. Do not use generic filler like "sound effect", "noise", "audio", "impact", "hit". If the frames do not explain the sound, infer from acoustics and lower your confidence.

2. Can the viewer already see what is making this sound? Answer "visible", "partly", or "unseen".

This is the most important question. A caption that describes what the picture already shows is noise — it takes up the frame and tells the viewer nothing. If a blizzard is filling the screen, do not caption the wind. If the shot is black and a chord lands, caption it, because that sound is the only thing happening.

3. Where in the frame is the source? x and y as fractions from 0 to 1, or offscreen: left | right | top | bottom if the source is outside the frame. Use the picture, not the stereo balance — many mixes are effectively mono and the balance carries no information.

Also return:
- confidence: 0 to 1, how sure you are of the identification
- reason: one short sentence explaining the call. This is shown to the viewer, so make it worth reading — say what the picture is doing and why this sound earns (or does not earn) a caption.

Timing, loudness, duration, behaviour and texture are measured from the waveform elsewhere. You do not decide any of those.`;

const NAMING_SCHEMA = {
  type: "object",
  properties: {
    text: {
      type: "string",
      description: "One to three lowercase words. Write the sound itself — onomatopoeia preferred ('clang', 'caw caw', 'whoooosh', 'crackle'). Not the source object or action.",
    },
    visibility: {
      type: "string",
      enum: ["visible", "partly", "unseen"],
      description: "Whether the picture already shows what makes this sound.",
    },
    x: {
      type: "number",
      description: "Horizontal position of source in frame, 0 (left) to 1 (right). Use 0.5 if offscreen or unclear.",
    },
    y: {
      type: "number",
      description: "Vertical position of source in frame, 0 (top) to 1 (bottom). Use 0.5 if offscreen or unclear.",
    },
    offscreen: {
      type: "string",
      enum: ["none", "left", "right", "top", "bottom"],
      description: "Which edge the source is off, or 'none' if in frame.",
    },
    confidence: {
      type: "number",
      description: "0 to 1 — how sure you are of the identification.",
    },
    reason: {
      type: "string",
      description: "One short sentence explaining what the picture is doing and why this sound earns or does not earn a caption.",
    },
  },
  required: ["text", "visibility", "x", "y", "offscreen", "confidence", "reason"],
  additionalProperties: false,
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}"));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return send(res, 405, { error: "method not allowed" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return send(res, 500, { error: "ANTHROPIC_API_KEY not set. Add it to .env.local (locally) or Vercel env vars (production)." });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return send(res, 400, { error: "invalid JSON body" });
  }

  const { frames, evidence, context } = body || {};
  if (!Array.isArray(frames) || frames.length === 0) {
    return send(res, 400, { error: "frames[] required (base64 JPEG, no data: prefix)" });
  }
  if (!evidence || typeof evidence !== "object") {
    return send(res, 400, { error: "evidence object required" });
  }

  const userText = [
    "Measured evidence for this sound:",
    "```json",
    JSON.stringify(evidence, null, 2),
    "```",
    context && context.length
      ? `\nNeighbouring cues (do not repeat these):\n${JSON.stringify(context, null, 2)}`
      : "",
    "\nReturn JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  const content = [];
  for (const b64 of frames.slice(0, 4)) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: b64 },
    });
  }
  content.push({ type: "text", text: userText });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      output_config: { format: { type: "json_schema", schema: NAMING_SCHEMA } },
      messages: [{ role: "user", content }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return send(res, 502, { error: "no text block in Claude response" });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return send(res, 502, { error: "Claude returned non-JSON", raw: textBlock.text });
    }

    return send(res, 200, {
      naming: parsed,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_read_input_tokens: response.usage.cache_read_input_tokens || 0,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens || 0,
      },
    });
  } catch (err) {
    const status = err?.status || 500;
    const message = err?.message || String(err);
    return send(res, status, { error: message });
  }
}
