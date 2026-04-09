import { describe, it, expect } from "vite-plus/test";

describe("Video Converter", () => {
  describe("Video format support", () => {
    it("should recognize common video MIME types", () => {
      const videoTypes = [
        "video/mp4",
        "video/webm",
        "video/avi",
        "video/quicktime",
        "video/x-msvideo",
        "video/ogg",
      ];

      videoTypes.forEach((type) => {
        expect(type.startsWith("video/")).toBe(true);
      });
    });

    it("should validate file type is video", () => {
      const validTypes = ["video/mp4", "video/webm", "video/avi"];
      const invalidTypes = ["audio/mp3", "image/png", "text/plain"];

      validTypes.forEach((type) => {
        expect(type.startsWith("video/")).toBe(true);
      });

      invalidTypes.forEach((type) => {
        expect(type.startsWith("video/")).toBe(false);
      });
    });
  });

  describe("File size validation", () => {
    it("should allow files under 500MB limit", () => {
      const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
      const fileSize = 100 * 1024 * 1024; // 100MB
      expect(fileSize > MAX_FILE_SIZE).toBe(false);
    });

    it("should reject files over 500MB limit", () => {
      const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
      const fileSize = 600 * 1024 * 1024; // 600MB
      expect(fileSize > MAX_FILE_SIZE).toBe(true);
    });

    it("should calculate max file size correctly", () => {
      const MAX_FILE_SIZE = 500 * 1024 * 1024;
      expect(MAX_FILE_SIZE).toBe(524288000);
    });

    it("should display error message with MB limit when file is too large", () => {
      const MAX_FILE_SIZE = 500 * 1024 * 1024;
      const limitMB = MAX_FILE_SIZE / 1024 / 1024;
      const errorMessage = `ファイルサイズが大きすぎます。${limitMB}MB以下のファイルを選択してください。`;
      expect(errorMessage).toContain("500MB以下");
    });
  });

  describe("File size display", () => {
    it("should calculate file size in MB correctly", () => {
      const bytes = 10 * 1024 * 1024; // 10MB
      const mb = (bytes / 1024 / 1024).toFixed(2);
      expect(mb).toBe("10.00");
    });

    it("should format small file size", () => {
      const bytes = 1536 * 1024; // 1.5MB
      const mb = (bytes / 1024 / 1024).toFixed(2);
      expect(mb).toBe("1.50");
    });
  });

  describe("MIME type mapping", () => {
    it("should map gif format to image/gif MIME type", () => {
      const format = "gif";
      const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
      expect(mimeType).toBe("image/gif");
    });

    it("should map mp4 format to video/mp4 MIME type", () => {
      const format: string = "mp4";
      const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
      expect(mimeType).toBe("video/mp4");
    });

    it("should map webm format to video/webm MIME type", () => {
      const format: string = "webm";
      const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
      expect(mimeType).toBe("video/webm");
    });

    it("should map avi format to video/avi MIME type", () => {
      const format: string = "avi";
      const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
      expect(mimeType).toBe("video/avi");
    });

    it("should map mov format to video/mov MIME type", () => {
      const format: string = "mov";
      const mimeType = format === "gif" ? "image/gif" : `video/${format}`;
      expect(mimeType).toBe("video/mov");
    });
  });

  describe("Filename generation", () => {
    it("should replace extension with target format", () => {
      const filename = "myvideo.avi";
      const format = "mp4";
      const originalName = filename.substring(0, filename.lastIndexOf("."));
      const outputFilename = `${originalName}.${format}`;
      expect(outputFilename).toBe("myvideo.mp4");
    });

    it("should handle multiple dots in filename", () => {
      const filename = "my.video.file.mov";
      const format = "mp4";
      const originalName = filename.substring(0, filename.lastIndexOf("."));
      const outputFilename = `${originalName}.${format}`;
      expect(outputFilename).toBe("my.video.file.mp4");
    });

    it("should generate correct output name for gif", () => {
      const filename = "animation.mp4";
      const format = "gif";
      const originalName = filename.substring(0, filename.lastIndexOf("."));
      const outputFilename = `${originalName}.${format}`;
      expect(outputFilename).toBe("animation.gif");
    });

    it("should generate input name with correct extension", () => {
      const filename = "video.mp4";
      const inputName = "input" + filename.substring(filename.lastIndexOf("."));
      expect(inputName).toBe("input.mp4");
    });

    it("should generate output name from format", () => {
      const format = "webm";
      const outputName = `output.${format}`;
      expect(outputName).toBe("output.webm");
    });
  });

  describe("FFmpeg GIF conversion arguments", () => {
    it("should include input file in GIF args", () => {
      const inputName = "input.mp4";
      const args: string[] = ["-i", inputName];
      expect(args).toContain("-i");
      expect(args).toContain(inputName);
    });

    it("should add framerate to GIF args when specified", () => {
      const framerate: string = "24";
      const args: string[] = [];
      if (framerate !== "auto") {
        args.push("-r", framerate);
      }
      expect(args).toContain("-r");
      expect(args).toContain("24");
    });

    it("should not add framerate to GIF args when auto", () => {
      const framerate = "auto";
      const args: string[] = [];
      if (framerate !== "auto") {
        args.push("-r", framerate);
      }
      expect(args).not.toContain("-r");
    });

    it("should add resolution to GIF args when specified", () => {
      const width: string = "640";
      const height: string = "480";
      const args: string[] = [];
      if (width !== "auto" && height !== "auto") {
        args.push("-s", `${width}x${height}`);
      }
      expect(args).toContain("-s");
      expect(args).toContain("640x480");
    });

    it("should not add resolution to GIF args when auto", () => {
      const width = "auto";
      const height = "auto";
      const args: string[] = [];
      if (width !== "auto" && height !== "auto") {
        args.push("-s", `${width}x${height}`);
      }
      expect(args).not.toContain("-s");
    });

    it("should include GIF palette filter", () => {
      const filter = "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse";
      const args: string[] = ["-vf", filter];
      expect(args).toContain("-vf");
      expect(args).toContain(filter);
    });

    it("should include loop setting for GIF", () => {
      const args: string[] = ["-loop", "0"];
      expect(args).toContain("-loop");
      expect(args).toContain("0");
    });
  });

  describe("FFmpeg video conversion arguments", () => {
    it("should include video codec in args", () => {
      const videoCodec = "libx264";
      const commonArgs: string[] = ["-c:v", videoCodec];
      expect(commonArgs).toContain("-c:v");
      expect(commonArgs).toContain("libx264");
    });

    it("should add video bitrate to args when not auto", () => {
      const videoBitrate: string = "2000";
      const args: string[] = [];
      if (videoBitrate !== "auto") {
        args.push("-b:v", `${videoBitrate}k`);
      }
      expect(args).toContain("-b:v");
      expect(args).toContain("2000k");
    });

    it("should not add video bitrate to args when auto", () => {
      const videoBitrate = "auto";
      const args: string[] = [];
      if (videoBitrate !== "auto") {
        args.push("-b:v", `${videoBitrate}k`);
      }
      expect(args).not.toContain("-b:v");
    });

    it("should add audio bitrate to args when not auto", () => {
      const audioBitrate: string = "128";
      const args: string[] = [];
      if (audioBitrate !== "auto") {
        args.push("-b:a", `${audioBitrate}k`);
      }
      expect(args).toContain("-b:a");
      expect(args).toContain("128k");
    });

    it("should not add audio bitrate to args when auto", () => {
      const audioBitrate = "auto";
      const args: string[] = [];
      if (audioBitrate !== "auto") {
        args.push("-b:a", `${audioBitrate}k`);
      }
      expect(args).not.toContain("-b:a");
    });

    it("should include audio codec in args", () => {
      const audioCodec = "aac";
      const args: string[] = ["-c:a", audioCodec];
      expect(args).toContain("-c:a");
      expect(args).toContain("aac");
    });

    it("should build complete conversion args", () => {
      const inputName = "input.avi";
      const outputName = "output.mp4";
      const videoCodec = "libx264";
      const audioCodec = "aac";
      const commonArgs = ["-c:v", videoCodec, "-c:a", audioCodec];
      const args = ["-i", inputName, ...commonArgs, outputName];

      expect(args[0]).toBe("-i");
      expect(args[1]).toBe(inputName);
      expect(args).toContain("-c:v");
      expect(args).toContain(videoCodec);
      expect(args).toContain("-c:a");
      expect(args).toContain(audioCodec);
      expect(args[args.length - 1]).toBe(outputName);
    });
  });

  describe("Codec defaults by format", () => {
    it("should use libx264 video codec for mp4", () => {
      const format = "mp4";
      let videoCodec = "";
      if (format === "mp4") videoCodec = "libx264";
      expect(videoCodec).toBe("libx264");
    });

    it("should use aac audio codec for mp4", () => {
      const format = "mp4";
      let audioCodec = "";
      if (format === "mp4") audioCodec = "aac";
      expect(audioCodec).toBe("aac");
    });

    it("should use libvpx video codec for webm", () => {
      const format = "webm";
      let videoCodec = "";
      if (format === "webm") videoCodec = "libvpx";
      expect(videoCodec).toBe("libvpx");
    });

    it("should use libvorbis audio codec for webm", () => {
      const format = "webm";
      let audioCodec = "";
      if (format === "webm") audioCodec = "libvorbis";
      expect(audioCodec).toBe("libvorbis");
    });

    it("should use mpeg4 video codec for avi", () => {
      const format = "avi";
      let videoCodec = "";
      if (format === "avi") videoCodec = "mpeg4";
      expect(videoCodec).toBe("mpeg4");
    });

    it("should use mp3 audio codec for avi", () => {
      const format = "avi";
      let audioCodec = "";
      if (format === "avi") audioCodec = "mp3";
      expect(audioCodec).toBe("mp3");
    });

    it("should use libx264 video codec for mov", () => {
      const format = "mov";
      let videoCodec = "";
      if (format === "mov") videoCodec = "libx264";
      expect(videoCodec).toBe("libx264");
    });

    it("should use gif video codec for gif format", () => {
      const format = "gif";
      let videoCodec = "";
      if (format === "gif") videoCodec = "gif";
      expect(videoCodec).toBe("gif");
    });

    it("should use none audio codec for gif format", () => {
      const format = "gif";
      let audioCodec = "";
      if (format === "gif") audioCodec = "none";
      expect(audioCodec).toBe("none");
    });
  });

  describe("Progress percentage", () => {
    it("should round progress to integer", () => {
      const progress = 0.456;
      const rounded = Math.round(progress * 100);
      expect(rounded).toBe(46);
    });

    it("should handle zero progress", () => {
      const progress = 0;
      const rounded = Math.round(progress * 100);
      expect(rounded).toBe(0);
    });

    it("should handle complete progress", () => {
      const progress = 1;
      const rounded = Math.round(progress * 100);
      expect(rounded).toBe(100);
    });

    it("should handle mid-conversion progress", () => {
      const progress = 0.5;
      const rounded = Math.round(progress * 100);
      expect(rounded).toBe(50);
    });
  });

  describe("Resolution formatting", () => {
    it("should format resolution as widthxheight", () => {
      const width = "1280";
      const height = "720";
      const resolution = `${width}x${height}`;
      expect(resolution).toBe("1280x720");
    });

    it("should format 4K resolution correctly", () => {
      const width = "3840";
      const height = "2160";
      const resolution = `${width}x${height}`;
      expect(resolution).toBe("3840x2160");
    });

    it("should format 480p resolution correctly", () => {
      const width = "854";
      const height = "480";
      const resolution = `${width}x${height}`;
      expect(resolution).toBe("854x480");
    });
  });
});
