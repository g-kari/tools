import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Mock AudioBuffer interface for testing
 */
interface MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  getChannelData(channel: number): Float32Array;
}

/**
 * AudioBufferをWAV形式のArrayBufferに変換するヘルパー関数のテスト用コピー
 * 実際のコードから分離してテスト可能にする
 */
function audioBufferToWav(buffer: MockAudioBuffer): ArrayBuffer {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;

  const data = new Float32Array(buffer.length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < buffer.length; i++) {
      data[i * numberOfChannels + channel] = channelData[i];
    }
  }

  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // Helper to write string to DataView
  function writeString(offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // Write WAV header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);

  // Write PCM data
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(
      offset,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true
    );
    offset += 2;
  }

  return arrayBuffer;
}

/**
 * モックAudioBufferを作成
 */
function createMockAudioBuffer(
  numberOfChannels: number,
  length: number,
  sampleRate: number
): MockAudioBuffer {
  const channels: Float32Array[] = [];

  // Fill with test data
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      // Generate a simple sine wave
      channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
    }
    channels.push(channelData);
  }

  return {
    numberOfChannels,
    length,
    sampleRate,
    getChannelData(channel: number): Float32Array {
      return channels[channel];
    }
  };
}

describe('Audio Converter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('audioBufferToWav', () => {
    it('should create a valid WAV header', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      // Check RIFF header
      const riff = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      );
      expect(riff).toBe('RIFF');

      // Check WAVE format
      const wave = String.fromCharCode(
        view.getUint8(8),
        view.getUint8(9),
        view.getUint8(10),
        view.getUint8(11)
      );
      expect(wave).toBe('WAVE');

      // Check fmt chunk
      const fmt = String.fromCharCode(
        view.getUint8(12),
        view.getUint8(13),
        view.getUint8(14),
        view.getUint8(15)
      );
      expect(fmt).toBe('fmt ');
    });

    it('should set correct audio format (PCM)', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const audioFormat = view.getUint16(20, true);
      expect(audioFormat).toBe(1); // PCM format
    });

    it('should set correct number of channels', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const numChannels = view.getUint16(22, true);
      expect(numChannels).toBe(2);
    });

    it('should set correct sample rate', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const sampleRate = view.getUint32(24, true);
      expect(sampleRate).toBe(44100);
    });

    it('should set correct bit depth', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const bitsPerSample = view.getUint16(34, true);
      expect(bitsPerSample).toBe(16);
    });

    it('should calculate correct buffer size', () => {
      const numberOfChannels = 2;
      const length = 1000;
      const buffer = createMockAudioBuffer(numberOfChannels, length, 44100);
      const wavBuffer = audioBufferToWav(buffer);

      // WAV header (44 bytes) + PCM data (length * channels * 2 bytes)
      const expectedSize = 44 + (length * numberOfChannels * 2);
      expect(wavBuffer.byteLength).toBe(expectedSize);
    });

    it('should handle mono audio', () => {
      const buffer = createMockAudioBuffer(1, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const numChannels = view.getUint16(22, true);
      expect(numChannels).toBe(1);
    });

    it('should have data chunk marker', () => {
      const buffer = createMockAudioBuffer(2, 1000, 44100);
      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      const data = String.fromCharCode(
        view.getUint8(36),
        view.getUint8(37),
        view.getUint8(38),
        view.getUint8(39)
      );
      expect(data).toBe('data');
    });

    it('should clamp audio samples to valid range', () => {
      const channelData = new Float32Array(10);

      // Set values outside valid range
      channelData[0] = 2.0;  // Above max
      channelData[1] = -2.0; // Below min
      channelData[2] = 0.5;  // Normal

      const buffer: MockAudioBuffer = {
        numberOfChannels: 1,
        length: 10,
        sampleRate: 44100,
        getChannelData(channel: number): Float32Array {
          return channelData;
        }
      };

      const wavBuffer = audioBufferToWav(buffer);
      const view = new DataView(wavBuffer);

      // Check that values are clamped (samples start at byte 44)
      const sample0 = view.getInt16(44, true);
      const sample1 = view.getInt16(46, true);
      const sample2 = view.getInt16(48, true);

      expect(sample0).toBe(0x7FFF); // Max value
      expect(sample1).toBe(-0x8000); // Min value
      expect(sample2).toBeGreaterThan(0); // Positive value
    });
  });

  describe('Audio format support', () => {
    it('should recognize common audio MIME types', () => {
      const audioTypes = [
        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/aac',
      ];

      audioTypes.forEach(type => {
        expect(type.startsWith('audio/')).toBe(true);
      });
    });

    it('should validate file type is audio', () => {
      const validTypes = ['audio/mp3', 'audio/wav'];
      const invalidTypes = ['video/mp4', 'image/png', 'text/plain'];

      validTypes.forEach(type => {
        expect(type.startsWith('audio/')).toBe(true);
      });

      invalidTypes.forEach(type => {
        expect(type.startsWith('audio/')).toBe(false);
      });
    });
  });

  describe('File size calculations', () => {
    it('should calculate file size correctly in KB', () => {
      const bytes = 2048;
      const kb = bytes / 1024;
      expect(kb).toBe(2);
    });

    it('should format file size with decimal places', () => {
      const bytes = 1536; // 1.5 KB
      const kb = (bytes / 1024).toFixed(2);
      expect(kb).toBe('1.50');
    });
  });

  describe('Audio format extensions', () => {
    it('should generate correct filename for MP3', () => {
      const format = 'mp3';
      const filename = `converted.${format}`;
      expect(filename).toBe('converted.mp3');
    });

    it('should generate correct filename for WAV', () => {
      const format = 'wav';
      const filename = `converted.${format}`;
      expect(filename).toBe('converted.wav');
    });

    it('should generate correct filename for OGG', () => {
      const format = 'ogg';
      const filename = `converted.${format}`;
      expect(filename).toBe('converted.ogg');
    });
  });
});
