import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Client, handle_file } from "@gradio/client";
import axios from "axios";
import { downloadAndConvertToMp3, urlToBlob } from "./helper.js";
import fs from "fs";
import multer from "multer";
import { Scraper, SearchMode } from "agent-twitter-client";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "video/mp4", limit: "15mb" })); // Parse audio blobs

const upload = multer();

const port = Number(process.env.PORT) || 8080;

app.get("/", async (req, res) => {
  res.send("saulgoodman....");
});

const hf_token = process.env.HF_TOKEN as `hf_${string}`;
// const neurals = ["en-CA-LiamNeural - en-CA (Male)"];
// const createVoiceNoteFromText = async (text: string) => {
//   const app = await Client.connect("logeshnusic/Edge-TTS-Text-to-Speech", {
//     hf_token,
//   });
//   const submitData = await app.submit(0, [text, neurals[0], 0, 0]);
//   console.log("Submitted");
//   let url = "";
//   for await (const msg of submitData) {
//     console.log(msg);
//     if (msg.type === "data") {
//       if (msg.data.length) {
//         const obj = msg.data[0] as { path: string; url: string };
//         const path = obj.path; ///tmp/gradio/134a03c5dd43ce16a51f6e3e50a1af2c60f3451560bfd43b1631a5d4677ae72c/tmpexgp7i23.mp3
//         url = obj.url; // https://logeshnusic-edge-tts-text-to-speech.hf.space/gradio_api/file=/tmp/gradio/134a03c5dd43ce16a51f6e3e50a1af2c60f3451560bfd43b1631a5d4677ae72c/tmpexgp7i23.mp3
//         console.log({ path, url });
//         return url;
//       }
//     }
//     if (msg.type === "status") {
//       console.log("Status: ", msg);
//     }
//   }
// };

const covertVoice = async (speechMp3Url: string) => {
  console.log("Coverting voice...");
  const speechMp3Blob = await urlToBlob(speechMp3Url);
  const uploadUrl = `https://logeshnusic-nusic-voice-cover-cpu.hf.space/upload`;
  const formData = new FormData();
  formData.append("files", speechMp3Blob);
  console.log("Uploading speech...");
  const uploadRes = await axios.post(uploadUrl, formData, {
    headers: { Authorization: `Bearer ${hf_token}` },
  });
  const speechMp3UploadedFilePath = uploadRes.data[0];
  const app = await Client.connect("logeshnusic/nusic-voice-cover-cpu", {
    hf_token,
  });
  console.log("Submitting...");
  // {"data":["/tmp/gradio/ab8a0ecb9090e0dcd83f145fdf2ae0c425f890f2/tmpucdwg8h7.mp3","Gura",0,false,1,0,0,0,0.5,3,0.25,"rmvpe",128,0.33,0,0.15,0.2,0.8,0.7,"mp3"],"event_data":null,"fn_index":6,"session_hash":"9ab5b757b3"}
  const submitData = app.submit(6, [
    speechMp3UploadedFilePath,
    "Elon",
    0, // Pitch Change Vocals Only,
    false,
    1, // int | float in 'parameter_57' Number component
    0, //# int | float (numeric value between -20 and 20) in 'Main Vocals' Slider component
    0, //# int | float (numeric value between -20 and 20) in 'Backup Vocals' Slider component
    0, //# int | float (numeric value between -20 and 20) in 'Music' Slider component
    0.5, //# int | float (numeric value between 0 and 1) in 'Index Rate' Slider component
    3, //# int | float (numeric value between 0 and 7) in 'Filter radius' Slider component
    0.25, // RMS # int | float (numeric value between 0 and 1) in 'RMS mix rate' Slider component
    "rmvpe",
    128, // # int | float (numeric value between 32 and 320) in 'Crepe hop length' Slider component
    0.33, //# int | float (numeric value between 0 and 0.5) in 'Protect rate' Slider component
    0, //# int | float (numeric value between -12 and 12) in 'Overall Pitch Change' Slider component
    0.15, // Room Size # int | float (numeric value between 0 and 1) in 'Room size' Slider component
    0.2, // Wetness Level # int | float (numeric value between 0 and 1) in 'Wetness level' Slider component
    0.8, // Dryness level # int | float (numeric value between 0 and 1) in 'Dryness level' Slider component
    0.7, // Damping # int | float (numeric value between 0 and 1) in 'Damping level' Slider component
    "mp3",
  ]);
  let url = "";
  for await (const msg of submitData) {
    if (msg.type === "data") {
      if (msg.data.length) {
        // {"msg":"process_completed","output":{"data":[{"name":"/tmp/gradio/293bf97852f967aa57b2a30af565f01cd8da2a9e/tmpucdwg8h7_stereo Gura Ver.mp3","data":null,"is_file":true,"orig_name":"tmpucdwg8h7_stereo Gura Ver.mp3"}],"is_generating":false,"duration":0.40207505226135254,"average_duration":78.84841537475586},"success":true}
        const obj = msg.data[0] as { name: string; orig_name: string };
        const path = obj.name; // /tmp/gradio/293bf97852f967aa57b2a30af565f01cd8da2a9e/tmpucdwg8h7_stereo Gura Ver.mp3
        url = `https://logeshnusic-nusic-voice-cover-cpu.hf.space/file=${path}`; // https://logeshnusic-edge-tts-text-to-speech.hf.space/gradio_api/file=/tmp/gradio/134a03c5dd43ce16a51f6e3e50a1af2c60f3451560bfd43b1631a5d4677ae72c/tmpexgp7i23.mp3
        console.log({ path, url });
        return url;
      }
    }
  }
};

// app.post("/ytp-content", async (req, res) => {
//   const vid = req.body.vid;
//   const ytpEndpoint = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${vid}&key=${process.env.YOUTUBE_API_KEY}`;
//   const ytpResponse = await axios.get(ytpEndpoint);
//   const data = ytpResponse.data;
//   const item = data.items[0];
//   const title = item.snippet.title;
//   const channelId = item.snippet.channelId;
//   const channelTitle = item.snippet.channelTitle;
//   const videoThumbnail = item.snippet.thumbnails.medium.url;
//   const videoDescription = item.snippet.description;
//   const iso8601Duration = item.contentDetails.duration;
//   const duration = moment.duration(iso8601Duration).asSeconds();

//   res.json({
//     title,
//     channelId,
//     channelTitle,
//     videoDescription,
//     videoThumbnail,
//     duration,
//   });
// });

app.post("/create-rvc-note", async (req, res) => {
  const text = req.body.text;
  // const speechUrl = await createVoiceNoteFromText(text);
  const voiceUrl = await covertVoice(
    "https://logeshnusic-edge-tts-text-to-speech.hf.space/gradio_api/file=/tmp/gradio/d7b7dcb2b3871c3bae3b641da1f2b8ab6606e4cde78652d92cfd2675aab142f6/tmpgki6xyc2.mp3"
  );
  res.json({ voiceUrl });
});
const voice_map = {
  trump:
    "https://firebasestorage.googleapis.com/v0/b/nusic-vox-player.appspot.com/o/trump-rally-15s.mp3?alt=media",
};

const synthesizeVoice = async (
  text: string,
  voice: keyof typeof voice_map
): Promise<{ url: string; path: string }> => {
  const app = await Client.connect("srinivasbilla/llasa-3b-tts", {
    hf_token,
  });
  const result = await app.predict("/infer", {
    sample_audio_path: handle_file(voice_map[voice]),
    target_text: text,
  });
  const data = result.data as { url: string; path: string };
  console.log(data);
  return data;
};

app.post("/llasa-voice-synthesizer", async (req, res) => {
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  const voice = req.body.voice as keyof typeof voice_map;
  const data = await synthesizeVoice(text, voice);
  res.json({ data, url: (data as any).url });
});

const scraper = new Scraper();

const getCookies = async () => {
  // Load from cookies.json
  const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf8"));
  return cookies;
};

const login = async () => {
  const cookies = await getCookies();
  if (cookies) {
    scraper.setCookies(cookies);
  } else {
    await scraper.login(
      process.env.TWITTER_USERNAME,
      process.env.TWITTER_PASSWORD
    );
    const cookies = await scraper.getCookies();
    fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
  }
};

const findMentions = async () => {
  const searchTweets = await scraper.fetchSearchTweets(
    `@CaptainGPT`,
    10,
    SearchMode.Latest
  );
  console.log(searchTweets);
  return searchTweets;
};
const ollamaUrl = "http://localhost:11434";

// TODO:
const getVoiceNameFromText = async (prompt: string) => {
  // get it using function calling LLM
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      prompt: `
      Extract the name of the person or character from this request: "${prompt}"
      Only return the name. Do not include any extra text. If you cannot find the name, return "None".
      `,
      stream: false,
      options: {
        temperature: 0.7,
        stop: ["\n"],
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        num_predict: 256,
      },
    }),
  });
  const data = await response.json();
  console.log({ data });
  const voiceName = data.response;
  return voiceName;
};

app.get("/voice-name/:text", async (req, res) => {
  const text = req.params.text;
  const voiceName = await getVoiceNameFromText(text);
  res.json({ voiceName });
});

app.post("/reply-to-mention", async (req, res) => {
  await login();
  const searchTweets = await findMentions();
  searchTweets.tweets.forEach(async (tweet) => {
    console.log(tweet);
    const text = tweet.text;
    if (text) {
      const voice = await getVoiceNameFromText(text);
      if (voice === "None") {
        return;
      }
      if (!voice_map[voice]) {
        // TODO: add voice to voice_map
        console.log("Voice not found: ", voice);
        return;
      }
      const resData = await synthesizeVoice(text, voice);
      if (resData?.url) {
        const localFilePath = `${tweet.id}.mp3`;
        await downloadAndConvertToMp3(resData.url, localFilePath);
        // convert to mp4
        const mediaData = [
          {
            data: fs.readFileSync(localFilePath),
            mediaType: "video/mp4",
          },
        ];
        await scraper.sendTweet(
          `Hey @${tweet.username}, here is ${voice} delivering the tweet`,
          tweet.id,
          mediaData
        );
        console.log("Tweet sent");
        fs.unlinkSync(localFilePath);
      }
    }
  });
  res.send("Success");
});

app.listen(port, async () => {
  console.log(`Webhook server listening on port ${port}`);
});
