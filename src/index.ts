import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { Client, handle_file } from "@gradio/client";
import axios from "axios";
import {
  downloadUrl,
  downloadYtAndConvertToMp3,
  sliceAndCombineBySpeakers,
} from "./helper.js";
import fs from "fs";
// import multer from "multer";
import { Scraper, SearchMode } from "agent-twitter-client";
import { uploadToFirebaseStorage } from "./services/storage/ytAudio.storage.js";
import {
  createJobDoc,
  getJobDoc,
  updateOnPyannoteJob,
} from "./services/db/pyannoteJobs.service.js";
import { deployAIVoiceNFT } from "./services/contracts/blockchain.js";
import { getNFTNameAndSymbolGroq, getTokenomicsGroq } from "./services/groq.js";

const app = express();
app.use(cors());
import { getVoiceNameFromTextGroq } from "./services/groq.js";
import { getUserVoiceSamplesDocs } from "./services/db/userVoiceSamples.js";
import { createCollection, mintNFT } from "./services/aptos/digitalAsset.js";
import { db } from "./services/firebase.service.js";
import { FieldValue } from "firebase-admin/firestore";
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: "video/mp4", limit: "15mb" })); // Parse audio blobs

// const upload = multer();

const port = Number(process.env.PORT) || 8080;

app.get("/", async (req, res) => {
  res.send("saulgoodman....");
});

const hf_token = process.env.HF_TOKEN as `hf_${string}`;

const searchYoutubeVideos = async (voiceName: string) => {
  // search for youtube videos with the voice name
  // what is the Best search for finding voice clips?
  // voice name + "voice"
  // Search Query #1:
  const searchQuery = `${voiceName} voice`;
  const searchEndpoint = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&key=${process.env.YOUTUBE_API_KEY}`;
  const searchResponse = await axios.get(searchEndpoint);
  const data = searchResponse.data;
  const items = data.items;
  return items;
};

const synthesizeVoice = async (
  text: string,
  audioUrl: string
): Promise<{ url: string; path: string }[]> => {
  const app = await Client.connect("adamnusic/llasa-3b-tts", {
    hf_token,
  });
  const result = await app.predict("/infer", {
    sample_audio_path: handle_file(audioUrl),
    target_text: text,
  });
  const data = result.data as { url: string; path: string }[];
  console.log(data);
  return data;
};

const scraper = new Scraper();

// const getCookies = async () => {
//   // Load from cookies.json
//   if (!fs.existsSync("cookies.json")) {
//     return null;
//   }
//   const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf8"));
//   console.log(cookies);
//   return cookies;
// };

const loginWithCreds = async () => {
  await scraper.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL
  );
  // const cookies = await scraper.getCookies();
  // fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
};

const login = async () => {
  // const cookies = await getCookies();
  // if (cookies) {
  //   console.log("Using existing cookies");
  //   try {
  //     scraper.setCookies(cookies);
  //   } catch (error) {
  //     console.log("Error setting cookies, trying to login with creds", error);
  //     await loginWithCreds();
  //   }
  // } else {
  // console.log("No cookies found, logging in...");
  await loginWithCreds();
  // }
};

// const findMentions = async () => {
//   const searchTweets = await scraper.fetchSearchTweets(
//     `@CaptainGPT`,
//     10,
//     SearchMode.Latest
//   );
//   console.log(searchTweets);
//   return searchTweets;
// };

const findVideos = async (text: string) => {
  const searchTweets = await scraper.fetchSearchTweets(
    text,
    10,
    SearchMode.Videos
  );
  return searchTweets.tweets.map((tweet) => ({
    text: tweet.text,
    videoId: tweet.videos[0].id,
    videoPreview: tweet.videos[0].preview,
    videoUrl: tweet.videos[0].url,
    views: tweet.views,
    likes: tweet.likes,
    username: tweet.username,
    id: tweet.id,
  }));
};

const youtubeSearchResults = async (voiceName: string) => {
  const videos = await searchYoutubeVideos(voiceName);
  if (videos.length === 0) {
    console.log("No videos found for voice: ", voiceName);
    return null;
  }
  const results = [];
  videos.map((video) => {
    results.push({
      title: video.snippet.title,
      description: video.snippet.description,
      id: video.id.videoId,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    });
  });
  return results;
};

app.post("/llasa-voice-synthesizer", async (req, res) => {
  const text = req.body.text;
  const audioUrl = req.body.audio_url;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  console.log("Synthesizing voice...: ", text, audioUrl);
  const data = await synthesizeVoice(text, audioUrl);
  if (data.length === 0) {
    return res.status(400).json({ error: "No data returned" });
  }
  const url = data[0].url;
  console.log({ text, url });
  res.json({ data, url });
});

app.post("/find-twitter-videos", async (req, res) => {
  const text = req.body.text;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }
  await login();
  const videos = await findVideos(text);
  res.json(videos);
});

app.post("/text-to-voicename", async (req, res) => {
  const text = req.body.text;
  const result = await getVoiceNameFromTextGroq(text);
  return res.json(result);
});

app.post("/voice-youtube-results", async (req, res) => {
  const voiceName = req.body.voice_name;
  const videos = await youtubeSearchResults(voiceName);
  res.json(videos);
});

app.post("/webhook/pyannote", async (req, res) => {
  const { jobId, status, output } = req.body;
  if (status === "succeeded") {
    const jobDoc = await getJobDoc(jobId);
    if (!jobDoc) {
      return res.status(400).json({ error: "Job not found" });
    }
    const { audioUrl } = jobDoc;
    // TODO: Save the diarization to the database
    const diarization = output.diarization as {
      start: number;
      end: number;
      speaker: string;
    }[];
    // Download from url
    const tempAudioPath = `${jobId}.mp3`;
    await downloadUrl(audioUrl, tempAudioPath);
    const audioPathObj = await sliceAndCombineBySpeakers(
      tempAudioPath,
      diarization
    );
    const paths = Object.values(audioPathObj);
    console.log(audioPathObj);
    await updateOnPyannoteJob(jobId, {
      diarization,
      speakers: paths,
    });
    // TODO: upload speakers audio to firebase
    for (const path of paths) {
      const pathInStorage = await uploadToFirebaseStorage(
        path,
        `${jobId}/${path}`
      );
      console.log(pathInStorage);
    }
    res.json({ speakers: paths });
  }
});

app.post("/video-speakers-extraction", async (req, res) => {
  const videoUrl = req.body.video_url;
  const isYoutube = req.body.is_youtube;
  const videoId = req.body.video_id;
  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required" });
  }
  const vId = isYoutube ? videoUrl.split("v=")[1] : videoId;
  const audioPath = `${vId}_120s.mp3`;
  try {
    if (isYoutube) {
      await downloadYtAndConvertToMp3(videoUrl, audioPath);
    } else {
      await downloadUrl(videoUrl, audioPath);
    }
  } catch (error) {
    console.log("Error downloading and converting to mp3", error);
    return res.status(500).json({
      error: "Error downloading and converting to mp3",
      type: "VIDEO_DOWNLOAD",
    });
  }
  console.log("Downloaded and converted to mp3");
  const audioUrl = await uploadToFirebaseStorage(audioPath, audioPath);
  console.log({ audioUrl });
  // PYANNOTE SPEAKERS EXTRACTION
  const pyannoteRes = await axios.post(
    `${process.env.PYANNOTE_SERVER_URL}/diarize`,
    {
      url: audioUrl,
      webhook: `${process.env.OWN_SERVER_URL}/webhook/pyannote`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PYANNOTE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const jobId = pyannoteRes.data.jobId;
  const status = pyannoteRes.data.status;
  console.log({ jobId, status });
  await createJobDoc(jobId, status, audioPath, audioUrl);
  res.json({ audioUrl, jobId });
});

app.post("/speakers-extraction", async (req, res) => {
  const audioUrl = req.body.audio_url;
  const audioPath = req.body.audio_path;
  if (!audioUrl) {
    return res.status(400).json({ error: "Audio URL is required" });
  }
  // PYANNOTE SPEAKERS EXTRACTION
  const pyannoteRes = await axios.post(
    `${process.env.PYANNOTE_SERVER_URL}/diarize`,
    {
      url: audioUrl,
      webhook: `${process.env.OWN_SERVER_URL}/webhook/pyannote`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PYANNOTE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  const jobId = pyannoteRes.data.jobId;
  const status = pyannoteRes.data.status;
  console.log({ jobId, status });
  await createJobDoc(jobId, status, audioPath, audioUrl);
  res.json({ audioPathInStorage: audioUrl, jobId });
});

app.post("/fetch-nft-info", async (req, res) => {
  const text = req.body.text;
  const nftInfo = await getNFTNameAndSymbolGroq(text);
  res.json({ nftInfo });
});

app.post("/deploy-nft", async (req, res) => {
  const voiceName = req.body.voice_name;
  const nftName = req.body.nft_name;
  const nftSymbol = req.body.nft_symbol;
  if (!voiceName || !nftName || !nftSymbol) {
    return res.status(400).json({ error: "Invalid request" });
  }
  // TODO: Mint the NFT
  const tx = await deployAIVoiceNFT(voiceName, nftName, nftSymbol, "test");
  res.json({ tx });
});

app.post("/tokenomics", async (req, res) => {
  const voiceName = req.body.voice_name;
  const tokenomics = await getTokenomicsGroq(voiceName);
  res.json(tokenomics);
});

app.post("/poke", async (req, res) => {
  res.send("pong");
});
app.post("/deploy-digital-asset-aptos", async (req, res) => {
  const url = await createCollection();
  res.json({ url });
});
app.post("/mint-digital-asset-aptos", async (req, res) => {
  const description = req.body.description || "Test Description";
  const name = req.body.name || "Test Name";
  const uri = req.body.uri || "";
  const url = await mintNFT(description, name, uri);
  res.json({ url });
});

app.get("/get-voice-docs", async (req, res) => {
  const docs = await getUserVoiceSamplesDocs();
  res.json(docs);
});

app.post("/vote-voxifi", async (req, res) => {
  const voteType = req.body.voteType;
  const clipId = req.body.audioClipId;
  const clipIdWithType = clipId + "_" + voteType;
  await db.doc(`/votes/6UgvTVg4Aj4tSM49Ufot`).update({
    [clipIdWithType]: FieldValue.increment(1),
    [clipId]: FieldValue.increment(1),
    total: FieldValue.increment(1),
  });
  res.json({ success: true });
});

app.post("/get-votes-voxifi", async (req, res) => {
  const votes = await db.doc(`/votes/6UgvTVg4Aj4tSM49Ufot`).get();
  const data = votes.data();
  console.log(data);
  res.json(data);
});

app.listen(port, async () => {
  console.log(`Webhook server listening on port ${port}`);
});

// Unused code:
// const ytAudioBlob = localAudioFileToBlob(audioPath);
// const uploadUrl = `https://delik-pyannote-speaker-diarization-3-1.hf.space/upload`;
// const formData = new FormData();
// formData.append("files", ytAudioBlob);
// const uploadRes = await axios.post(uploadUrl, formData, {
//   headers: { Authorization: `Bearer ${hf_token}` },
// });
// const [path] = uploadRes.data;
// const app = await Client.connect("Delik/pyannote-speaker-diarization-3.1", {
//   hf_token,
// });
// const result = app.predict("/process_audio", [path, 0, 0, 0]);

// const findYtVoiceClipFromVoiceName = async (
//   voiceName: string
// ): Promise<{
//   videoTitle: string;
//   videoId: string;
//   videoUrl: string;
// } | null> => {
//   const videos = await searchYoutubeVideos(voiceName);
//   if (videos.length === 0) {
//     console.log("No videos found for voice: ", voiceName);
//     return null;
//   }
//   console.log("No of videos found for voice: ", videos.length);
//   const titleIdMap = {};
//   const titles = videos.map((video) => {
//     titleIdMap[video.snippet.title] = video.id.videoId;
//     return video.snippet.title;
//   });
//   // TODO: Run the titles through LLM to find a matching video for analysis
//   const videoTitle = await analyzeVideoTitles(titles);
//   if (!videoTitle) {
//     console.log("No matching video found for voice: ", voiceName);
//     return null;
//   }
//   const videoId = titleIdMap[videoTitle];
//   const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
//   console.log("Selected video: ", videoTitle, " - ", videoUrl);
//   return { videoTitle, videoId, videoUrl };
// };

// TODO:
// const voiceNameToDataset = async (voiceName: string) => {
//   const videoInfo = await findYtVoiceClipFromVoiceName(voiceName);
//   if (!videoInfo) {
//     console.log("No video found for voice: ", voiceName);
//     return;
//   }
//   const { videoTitle, videoId, videoUrl } = videoInfo;
//   const audioFilePath = `${videoId}.mp3`;
//   // TODO: Save it for reasoning
//   await downloadYtAndConvertToMp3(videoUrl, audioFilePath);
//   // TODO: Speaker Data
//   // TODO: Save the mapping
// };

// app.post("/create-rvc-note", async (req, res) => {
//   const text = req.body.text;
//   // const speechUrl = await createVoiceNoteFromText(text);
//   const voiceUrl = await covertVoice(
//     "https://logeshnusic-edge-tts-text-to-speech.hf.space/gradio_api/file=/tmp/gradio/d7b7dcb2b3871c3bae3b641da1f2b8ab6606e4cde78652d92cfd2675aab142f6/tmpgki6xyc2.mp3"
//   );
//   res.json({ voiceUrl });
// });

// app.post("/reply-to-mentions", async (req, res) => {
//   await login();
//   const searchTweets = await findMentions();
//   searchTweets.tweets.forEach(async (tweet) => {
//     console.log(tweet);
//     const text = tweet.text;
//     if (text) {
//       const voice = await getVoiceNameFromText(text);
//       if (voice.voice_name === "None") {
//         return;
//       }
//       if (!voice_map[voice.voice_name]) {
//         return;
//       }
//       const resData = await synthesizeVoice(text, "trump"); // TODO: Change this to the voice name
//       if (resData?.url) {
//         const localFilePath = `${tweet.id}.mp3`;
//         await downloadUrl(resData.url, localFilePath);
//         // convert to mp4
//         const mediaData = [
//           {
//             data: fs.readFileSync(localFilePath),
//             mediaType: "video/mp4",
//           },
//         ];
//         await scraper.sendTweet(
//           `Hey @${tweet.username}, here is ${voice} delivering the tweet`,
//           tweet.id,
//           mediaData
//         );
//         console.log("Tweet sent");
//         fs.unlinkSync(localFilePath);
//       }
//     }
//   });
//   res.send("Success");
// });
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

// const covertVoice = async (speechMp3Url: string) => {
//   console.log("Coverting voice...");
//   const speechMp3Blob = await urlToBlob(speechMp3Url);
//   const uploadUrl = `https://logeshnusic-nusic-voice-cover-cpu.hf.space/upload`;
//   const formData = new FormData();
//   formData.append("files", speechMp3Blob);
//   console.log("Uploading speech...");
//   const uploadRes = await axios.post(uploadUrl, formData, {
//     headers: { Authorization: `Bearer ${hf_token}` },
//   });
//   const speechMp3UploadedFilePath = uploadRes.data[0];
//   const app = await Client.connect("logeshnusic/nusic-voice-cover-cpu", {
//     hf_token,
//   });
//   console.log("Submitting...");
//   // {"data":["/tmp/gradio/ab8a0ecb9090e0dcd83f145fdf2ae0c425f890f2/tmpucdwg8h7.mp3","Gura",0,false,1,0,0,0,0.5,3,0.25,"rmvpe",128,0.33,0,0.15,0.2,0.8,0.7,"mp3"],"event_data":null,"fn_index":6,"session_hash":"9ab5b757b3"}
//   const submitData = app.submit(6, [
//     speechMp3UploadedFilePath,
//     "Elon",
//     0, // Pitch Change Vocals Only,
//     false,
//     1, // int | float in 'parameter_57' Number component
//     0, //# int | float (numeric value between -20 and 20) in 'Main Vocals' Slider component
//     0, //# int | float (numeric value between -20 and 20) in 'Backup Vocals' Slider component
//     0, //# int | float (numeric value between -20 and 20) in 'Music' Slider component
//     0.5, //# int | float (numeric value between 0 and 1) in 'Index Rate' Slider component
//     3, //# int | float (numeric value between 0 and 7) in 'Filter radius' Slider component
//     0.25, // RMS # int | float (numeric value between 0 and 1) in 'RMS mix rate' Slider component
//     "rmvpe",
//     128, // # int | float (numeric value between 32 and 320) in 'Crepe hop length' Slider component
//     0.33, //# int | float (numeric value between 0 and 0.5) in 'Protect rate' Slider component
//     0, //# int | float (numeric value between -12 and 12) in 'Overall Pitch Change' Slider component
//     0.15, // Room Size # int | float (numeric value between 0 and 1) in 'Room size' Slider component
//     0.2, // Wetness Level # int | float (numeric value between 0 and 1) in 'Wetness level' Slider component
//     0.8, // Dryness level # int | float (numeric value between 0 and 1) in 'Dryness level' Slider component
//     0.7, // Damping # int | float (numeric value between 0 and 1) in 'Damping level' Slider component
//     "mp3",
//   ]);
//   let url = "";
//   for await (const msg of submitData) {
//     if (msg.type === "data") {
//       if (msg.data.length) {
//         // {"msg":"process_completed","output":{"data":[{"name":"/tmp/gradio/293bf97852f967aa57b2a30af565f01cd8da2a9e/tmpucdwg8h7_stereo Gura Ver.mp3","data":null,"is_file":true,"orig_name":"tmpucdwg8h7_stereo Gura Ver.mp3"}],"is_generating":false,"duration":0.40207505226135254,"average_duration":78.84841537475586},"success":true}
//         const obj = msg.data[0] as { name: string; orig_name: string };
//         const path = obj.name; // /tmp/gradio/293bf97852f967aa57b2a30af565f01cd8da2a9e/tmpucdwg8h7_stereo Gura Ver.mp3
//         url = `https://logeshnusic-nusic-voice-cover-cpu.hf.space/file=${path}`; // https://logeshnusic-edge-tts-text-to-speech.hf.space/gradio_api/file=/tmp/gradio/134a03c5dd43ce16a51f6e3e50a1af2c60f3451560bfd43b1631a5d4677ae72c/tmpexgp7i23.mp3
//         console.log({ path, url });
//         return url;
//       }
//     }
//   }
// };
