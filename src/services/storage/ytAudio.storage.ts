import axios from "axios";
import fs from "fs";
import { storage } from "../firebase.service.js";

const FOLDER_NAME = "tts-yt-audio";

const uploadHfUrlToFirebase = async (
  url: string,
  coverDocId: string,
  voiceID: string,
  hfToken: string
): Promise<string> => {
  const response = await axios.get(url, {
    responseType: "stream",
    headers: { Authorization: `Bearer ${hfToken}` },
  });
  const localFilePath = url.split("/")[url.split("/").length - 1];
  // path.join(__dirname, "temp.mp4");
  const writer = fs.createWriteStream(localFilePath);

  response.data.pipe(writer);
  const fullPath = `${FOLDER_NAME}/${coverDocId}/${voiceID}.mp3`;
  return new Promise((resolve, reject) => {
    writer.on("finish", async () => {
      try {
        await uploadToFirebaseStorage(localFilePath, fullPath);
        resolve(fullPath);
      } catch (error) {
        console.error("Error uploading file:", error);
        reject(error);
      } finally {
        fs.unlinkSync(localFilePath); // Delete the temporary local file after upload
      }
    });

    writer.on("error", (error) => {
      console.error("Error downloading file:", error);
      reject(error);
    });
  });
};

export const uploadToFirebaseStorage = async (
  fromFilePath: string,
  toFilePath: string
) => {
  await storage.bucket().upload(fromFilePath, {
    destination: `${FOLDER_NAME}/${toFilePath}`,
    metadata: {
      contentType: "audio/mpeg", // Set the content type for MP3 files
    },
  });
  console.log("File uploaded successfully.");
  return `https://voxaudio.nusic.fm/tts-yt-audio%2F${toFilePath}?alt=media`;
};

export { uploadHfUrlToFirebase };
