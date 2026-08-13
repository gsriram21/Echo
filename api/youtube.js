import ytdl from "@distube/ytdl-core";

// Vercel serverless functions default to a small body limit; disable it for streaming.
export const config = {
  api: { bodyParser: false, responseLimit: false },
  maxDuration: 60,
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  const url = new URL(req.url, "http://localhost").searchParams.get("url");
  if (!url) {
    return send(res, 400, { error: "url query param required" });
  }
  if (!ytdl.validateURL(url)) {
    return send(res, 400, { error: "not a valid YouTube URL" });
  }

  try {
    // Get info so we can pick a format and know the content-length up front.
    const info = await ytdl.getInfo(url);

    // Prefer a single-file mp4 with both audio and video, small enough to stream in one shot.
    // itag 18 (360p mp4 with audio) is the most reliable "single file" YouTube format.
    let format = ytdl.chooseFormat(info.formats, {
      quality: "18",
      filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo,
    });
    if (!format) {
      format = ytdl.chooseFormat(info.formats, {
        quality: "lowest",
        filter: (f) => f.container === "mp4" && f.hasAudio && f.hasVideo,
      });
    }
    if (!format) {
      return send(res, 502, { error: "no combined mp4 format available for this video" });
    }

    res.setHeader("Content-Type", "video/mp4");
    if (format.contentLength) {
      res.setHeader("Content-Length", format.contentLength);
    }
    // No range support in this simple proxy — the browser will fall back to sequential download.
    res.setHeader("Accept-Ranges", "none");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("X-Echo-Title", encodeURIComponent(info.videoDetails.title || "").slice(0, 200));

    const stream = ytdl.downloadFromInfo(info, { format });
    stream.on("error", (err) => {
      if (!res.headersSent) {
        send(res, 502, { error: "download failed: " + err.message });
      } else {
        res.destroy(err);
      }
    });
    stream.pipe(res);
  } catch (err) {
    return send(res, 500, { error: err.message || String(err) });
  }
}
