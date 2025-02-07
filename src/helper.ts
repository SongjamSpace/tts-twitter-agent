import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import axios from "axios";
import fs from "fs";
import mm from "music-metadata";

export const downloadYtAndConvertToMp3 = async (
  url: string,
  tmpOutputPath: string
) => {
  // Download YouTube video as readable stream
  const videoReadableStream = ytdl(url, { filter: "audioonly" });

  // Convert the video to MP3 format using ffmpeg
  const ffmpegCommand = ffmpeg(videoReadableStream)
    .format("mp3")
    .audioBitrate(128) // You can set the desired bitrate
    .setDuration(2 * 60) // Set duration to 120 seconds (2 minutes)
    .on("error", (err) => {
      console.error("Error during conversion:", err);
    });

  // Setup a promise to handle the conversion completion
  const conversionPromise = new Promise((resolve, reject) => {
    ffmpegCommand.on("end", () => {
      resolve("");
    });
  });

  // Run ffmpeg command
  ffmpegCommand.saveToFile(tmpOutputPath);

  // Wait for the conversion to finish
  await conversionPromise;

  // // Delete the temporary MP3 file
  // fs.unlinkSync(outputPath);

  return tmpOutputPath;
};

export const getMp3Duration = async (filePath: string) => {
  try {
    const metadata = await mm.parseFile(filePath, { duration: true });
    return metadata.format.duration;
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

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
export const mergeAudioFilesUsingFfmpeg = async (
  instrumentalUrl: string,
  vocalUrl: string,
  outputPath: string
) => {
  await downloadUrl(instrumentalUrl, "audio_1.mp3");
  await downloadUrl(vocalUrl, "audio_2.mp3");
  const ffmpegCommand = ffmpeg()
    .input("audio_1.mp3")
    .input("audio_2.mp3")
    .complexFilter([
      // Mix without changing the volume
      "[0:a][1:a]amix=inputs=2:duration=first",
    ])
    .audioCodec("libmp3lame")
    .audioBitrate(128)
    .on("error", (err) => {
      console.error("Error during conversion:", err);
    })
    .on("end", () => {
      console.log("Merging completed");
    });

  const conversionPromise = new Promise((resolve, reject) => {
    ffmpegCommand.on("end", () => {
      resolve("");
    });
  });

  ffmpegCommand.save(outputPath);

  await conversionPromise;

  return outputPath;
};

export const sliceAndCombineBySpeakers = async (
  audioPath: string,
  diarization: {
    start: number;
    end: number;
    speaker: string;
  }[]
) => {
  // Group segments by speaker
  const speakerSegments: { [key: string]: { start: number; end: number }[] } =
    {};

  // Filter segments less than 1 second and group by speaker
  diarization.forEach((segment) => {
    const duration = segment.end - segment.start;
    if (duration >= 1) {
      if (!speakerSegments[segment.speaker]) {
        speakerSegments[segment.speaker] = [];
      }
      speakerSegments[segment.speaker].push({
        start: segment.start,
        end: segment.end,
      });
    }
  });

  const outputFiles: { [key: string]: string } = {};
  const tempDir = "temp_segments";

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // Process each speaker's segments
  for (const [speaker, segments] of Object.entries(speakerSegments)) {
    const speakerSegmentFiles: string[] = [];

    // Cut each segment into separate files
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentPath = `${tempDir}/segment_${speaker}_${i}.mp3`;

      // Use ffmpeg to cut the segment
      await new Promise((resolve, reject) => {
        ffmpeg(audioPath)
          .setStartTime(segment.start)
          .setDuration(segment.end - segment.start)
          .output(segmentPath)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });

      speakerSegmentFiles.push(segmentPath);
    }

    // Combine all segments for this speaker
    const outputPath = `${speaker}_combined.mp3`;
    const ffmpegCommand = ffmpeg();

    // Add all segment files as inputs
    speakerSegmentFiles.forEach((file) => {
      ffmpegCommand.input(file);
    });

    // Concatenate all segments
    await new Promise((resolve, reject) => {
      ffmpegCommand
        .on("end", () => {
          // Clean up temporary segment files
          speakerSegmentFiles.forEach((file) => fs.unlinkSync(file));
          resolve(null);
        })
        .on("error", reject)
        .mergeToFile(outputPath, tempDir);
    });

    outputFiles[speaker] = outputPath;
  }

  // Clean up temp directory
  fs.rmdirSync(tempDir);

  return outputFiles;
};
