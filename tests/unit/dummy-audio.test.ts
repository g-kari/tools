import { describe, it, expect } from 'vitest';
import { generateAudioSamples, audioBufferToWav } from '../../app/routes/dummy-audio';

describe('Dummy Audio Generator - Unit Tests', () => {
  describe('generateAudioSamples', () => {
    const sampleRate = 44100;

    it('should generate correct number of samples', () => {
      const duration = 1;
      const samples = generateAudioSamples('sine', 440, duration, 100, sampleRate);
      expect(samples.length).toBe(sampleRate * duration);
    });

    it('should generate samples within amplitude range', () => {
      const samples = generateAudioSamples('sine', 440, 0.1, 100, sampleRate);
      for (const sample of samples) {
        expect(sample).toBeGreaterThanOrEqual(-1);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it('should scale amplitude with volume', () => {
      const fullVolume = generateAudioSamples('sine', 440, 0.01, 100, sampleRate);
      const halfVolume = generateAudioSamples('sine', 440, 0.01, 50, sampleRate);

      const maxFull = Math.max(...fullVolume.map(Math.abs));
      const maxHalf = Math.max(...halfVolume.map(Math.abs));

      expect(maxHalf).toBeLessThan(maxFull);
      expect(maxHalf).toBeCloseTo(maxFull / 2, 1);
    });

    it('should generate sine wave correctly', () => {
      const samples = generateAudioSamples('sine', 1, 1, 100, 4);
      // At 1Hz with 4 samples per second:
      // t=0: sin(0) = 0
      // t=0.25: sin(π/2) = 1
      // t=0.5: sin(π) ≈ 0
      // t=0.75: sin(3π/2) = -1
      expect(samples[0]).toBeCloseTo(0, 5);
      expect(samples[1]).toBeCloseTo(1, 5);
      expect(samples[2]).toBeCloseTo(0, 5);
      expect(samples[3]).toBeCloseTo(-1, 5);
    });

    it('should generate square wave with only -1 and 1 values', () => {
      const samples = generateAudioSamples('square', 440, 0.1, 100, sampleRate);
      for (const sample of samples) {
        expect(Math.abs(sample)).toBeCloseTo(1, 5);
      }
    });

    it('should generate triangle wave within range', () => {
      const samples = generateAudioSamples('triangle', 440, 0.1, 100, sampleRate);
      for (const sample of samples) {
        expect(sample).toBeGreaterThanOrEqual(-1);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it('should generate sawtooth wave within range', () => {
      const samples = generateAudioSamples('sawtooth', 440, 0.1, 100, sampleRate);
      for (const sample of samples) {
        expect(sample).toBeGreaterThanOrEqual(-1);
        expect(sample).toBeLessThanOrEqual(1);
      }
    });

    it('should generate noise with random values', () => {
      const samples1 = generateAudioSamples('noise', 440, 0.01, 100, sampleRate);
      const samples2 = generateAudioSamples('noise', 440, 0.01, 100, sampleRate);

      // Noise should be different each time
      let diffCount = 0;
      for (let i = 0; i < samples1.length; i++) {
        if (samples1[i] !== samples2[i]) diffCount++;
      }
      expect(diffCount).toBeGreaterThan(samples1.length * 0.9);
    });

    it('should generate zero samples when volume is 0', () => {
      const samples = generateAudioSamples('sine', 440, 0.1, 0, sampleRate);
      for (const sample of samples) {
        expect(sample).toBeCloseTo(0, 10);
      }
    });

    it('should handle short duration', () => {
      const samples = generateAudioSamples('sine', 440, 0.1, 100, sampleRate);
      expect(samples.length).toBe(4410); // 0.1 * 44100
    });

    it('should handle long duration', () => {
      const samples = generateAudioSamples('sine', 440, 60, 100, sampleRate);
      expect(samples.length).toBe(2646000); // 60 * 44100
    });
  });

  describe('audioBufferToWav', () => {
    // Mock AudioBuffer for testing
    function createMockAudioBuffer(samples: Float32Array, sampleRate: number): AudioBuffer {
      return {
        length: samples.length,
        sampleRate,
        numberOfChannels: 1,
        duration: samples.length / sampleRate,
        getChannelData: () => samples,
        copyFromChannel: () => {},
        copyToChannel: () => {},
      } as unknown as AudioBuffer;
    }

    it('should create valid WAV header', () => {
      const samples = new Float32Array([0, 0.5, 1, -1, -0.5, 0]);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      // Check RIFF header
      expect(String.fromCharCode(view.getUint8(0))).toBe('R');
      expect(String.fromCharCode(view.getUint8(1))).toBe('I');
      expect(String.fromCharCode(view.getUint8(2))).toBe('F');
      expect(String.fromCharCode(view.getUint8(3))).toBe('F');

      // Check WAVE format
      expect(String.fromCharCode(view.getUint8(8))).toBe('W');
      expect(String.fromCharCode(view.getUint8(9))).toBe('A');
      expect(String.fromCharCode(view.getUint8(10))).toBe('V');
      expect(String.fromCharCode(view.getUint8(11))).toBe('E');
    });

    it('should have correct file size in header', () => {
      const samples = new Float32Array(100);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      const fileSize = view.getUint32(4, true);
      expect(fileSize).toBe(wav.byteLength - 8);
    });

    it('should have correct format chunk', () => {
      const samples = new Float32Array(100);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      // fmt chunk
      expect(String.fromCharCode(view.getUint8(12))).toBe('f');
      expect(String.fromCharCode(view.getUint8(13))).toBe('m');
      expect(String.fromCharCode(view.getUint8(14))).toBe('t');
      expect(String.fromCharCode(view.getUint8(15))).toBe(' ');

      // Format = 1 (PCM)
      expect(view.getUint16(20, true)).toBe(1);

      // Mono (1 channel)
      expect(view.getUint16(22, true)).toBe(1);

      // Sample rate
      expect(view.getUint32(24, true)).toBe(44100);

      // Bits per sample
      expect(view.getUint16(34, true)).toBe(16);
    });

    it('should have data chunk with correct size', () => {
      const samples = new Float32Array(100);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      // data chunk
      expect(String.fromCharCode(view.getUint8(36))).toBe('d');
      expect(String.fromCharCode(view.getUint8(37))).toBe('a');
      expect(String.fromCharCode(view.getUint8(38))).toBe('t');
      expect(String.fromCharCode(view.getUint8(39))).toBe('a');

      // Data size = samples * 2 bytes (16-bit)
      const dataSize = view.getUint32(40, true);
      expect(dataSize).toBe(100 * 2);
    });

    it('should correctly encode audio samples', () => {
      const samples = new Float32Array([0, 1, -1, 0.5, -0.5]);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      // Check encoded samples (starting at offset 44)
      expect(view.getInt16(44, true)).toBe(0);         // 0
      expect(view.getInt16(46, true)).toBe(32767);     // 1 -> 0x7FFF
      expect(view.getInt16(48, true)).toBe(-32768);    // -1 -> -0x8000
      expect(view.getInt16(50, true)).toBeCloseTo(16383, -1); // 0.5
      expect(view.getInt16(52, true)).toBeCloseTo(-16384, -1); // -0.5
    });

    it('should clamp samples outside [-1, 1] range', () => {
      const samples = new Float32Array([2, -2]);
      const buffer = createMockAudioBuffer(samples, 44100);
      const wav = audioBufferToWav(buffer);
      const view = new DataView(wav);

      // Should be clamped to max/min values
      expect(view.getInt16(44, true)).toBe(32767);
      expect(view.getInt16(46, true)).toBe(-32768);
    });
  });
});
