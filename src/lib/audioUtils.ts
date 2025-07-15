// audioUtils.ts
// Tiện ích quản lý Web Audio API cho Movie Player

export interface AudioNodes {
  audioCtx: AudioContext;
  source: MediaElementAudioSourceNode;
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  gain: GainNode;
}

export async function setupAudioNodes(video: HTMLVideoElement): Promise<AudioNodes> {
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(video);

  // 1. Bass filter (lowshelf)
  const lowFilter = audioCtx.createBiquadFilter();
  lowFilter.type = 'lowshelf';
  lowFilter.frequency.value = 80;
  lowFilter.gain.value = 23;

  // 2. Mid filter (peaking)
  const midFilter = audioCtx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 1000;
  midFilter.Q.value = 1;
  midFilter.gain.value = 5;

  // 3. Treble filter (highshelf)
  const highFilter = audioCtx.createBiquadFilter();
  highFilter.type = 'highshelf';
  highFilter.frequency.value = 4500;
  highFilter.gain.value = 10;

  // 4. Compressor
  const compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 20;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.25;

  // 5. Gain
  const gain = audioCtx.createGain();
  gain.gain.value = 1.5;

  // Kết nối chuỗi node
  source
    .connect(lowFilter)
    .connect(midFilter)
    .connect(highFilter)
    .connect(compressor)
    .connect(gain)
    .connect(audioCtx.destination);

  return { audioCtx, source, lowFilter, midFilter, highFilter, compressor, gain };
}

export function cleanupAudioNodes(nodes: Partial<AudioNodes>) {
  try {
    nodes.audioCtx?.close();
  } catch {}
  // Xóa tham chiếu
  if (nodes) {
    Object.keys(nodes).forEach(key => {
      // @ts-expect-error: set to null for cleanup
      nodes[key] = null;
    });
  }
} 