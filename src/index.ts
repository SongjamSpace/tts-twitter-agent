import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import AgentRouter from "./songjam-agent.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// const upload = multer();

const port = Number(process.env.PORT) || 8080;

// create router
app.use("/api", AgentRouter);

app.get("/", async (req, res) => {
  res.send("saulgoodman....");
});

// const scraper = new Scraper();

// const getCookies = async () => {
//   // Load from cookies.json
//   if (!fs.existsSync("cookies.json")) {
//     return null;
//   }
//   const cookies = JSON.parse(fs.readFileSync("cookies.json", "utf8"));
//   console.log(cookies);
//   return cookies;
// };

// const loginWithCreds = async () => {
//   await scraper.login(
//     process.env.TWITTER_USERNAME,
//     process.env.TWITTER_PASSWORD,
//     process.env.TWITTER_EMAIL
//   );
//   // const cookies = await scraper.getCookies();
//   // fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
// };

// const login = async () => {
//   // const cookies = await getCookies();
//   // if (cookies) {
//   //   console.log("Using existing cookies");
//   //   try {
//   //     scraper.setCookies(cookies);
//   //   } catch (error) {
//   //     console.log("Error setting cookies, trying to login with creds", error);
//   //     await loginWithCreds();
//   //   }
//   // } else {
//   // console.log("No cookies found, logging in...");
//   await loginWithCreds();
//   // }
// };

// const findMentions = async () => {
//   const searchTweets = await scraper.fetchSearchTweets(
//     `@CaptainGPT`,
//     10,
//     SearchMode.Latest
//   );
//   console.log(searchTweets);
//   return searchTweets;
// };

// const findVideos = async (text: string) => {
//   const searchTweets = await scraper.fetchSearchTweets(
//     text,
//     10,
//     SearchMode.Videos
//   );
//   return searchTweets.tweets.map((tweet) => ({
//     text: tweet.text,
//     videoId: tweet.videos[0].id,
//     videoPreview: tweet.videos[0].preview,
//     videoUrl: tweet.videos[0].url,
//     views: tweet.views,
//     likes: tweet.likes,
//     username: tweet.username,
//     id: tweet.id,
//   }));
// };

// app.post("/find-twitter-videos", async (req, res) => {
//   const text = req.body.text;
//   if (!text) {
//     return res.status(400).json({ error: "Text is required" });
//   }
//   await login();
//   const videos = await findVideos(text);
//   res.json(videos);
// });

app.listen(port, async () => {
  console.log(`Webhook server listening on port ${port}`);
});
