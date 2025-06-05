import axios from "axios";
import fs from "fs";

export const localAudioFileToBlob = (localPath: string) => {
  const audioFile = fs.readFileSync(localPath);
  return new Blob([audioFile]);
};

export const urlToBlob = async (url: string): Promise<Blob> => {
  // Download the song to local:
  const mp3Res = await axios.get(url, { responseType: "arraybuffer" });
  //   fs.writeFileSync("downloaded_file.mp3", Buffer.from(mp3Res.data));
  return new Blob([mp3Res.data]);
};

export const mp3ToBase64 = async (mp3Url: string) => {
  try {
    // Fetch MP3 file
    const response = await axios.get(mp3Url, { responseType: "arraybuffer" });
    // Convert array buffer to base64
    const base64String = Buffer.from(response.data, "binary").toString(
      "base64"
    );
    // Prepend 'data:audio/mpeg;base64' to the base64 string
    const audioBase64String = `data:audio/mpeg;base64,${base64String}`;
    return audioBase64String;
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
};
export const downloadUrl = async (url: string, outputPath: string) => {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
};
