/** Raw microphone audio, kept in memory only until it is turned into a WAV and sent. */
export type Recording = { chunks: Float32Array[]; sampleRate: number };

export type Recorder = {
  /** Stops the microphone and returns what was recorded. */
  stop(): Promise<Recording>;
  /** Stops the microphone and drops the audio. */
  cancel(): void;
};

// Collects the first input channel in ~4096-sample chunks; "flush" sends what is left.
const CAPTURE_WORKLET = `
class Capture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.size = 0;
    this.port.onmessage = () => this.flush(true);
  }
  flush(last) {
    const out = new Float32Array(this.size);
    let offset = 0;
    for (const part of this.buffer) { out.set(part, offset); offset += part.length; }
    this.buffer = [];
    this.size = 0;
    this.port.postMessage({ samples: out, last: !!last });
  }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      this.buffer.push(channel.slice(0));
      this.size += channel.length;
      if (this.size >= 4096) this.flush(false);
    }
    return true;
  }
}
registerProcessor("fabulka-capture", Capture);
`;

/** True when this browser can record at all (it also needs a secure page). */
export function canRecord(): boolean {
  return typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && "AudioWorkletNode" in window;
}

/**
 * Starts recording mono audio from the microphone. Throws the browser's DOMException when the
 * parent refuses access (name "NotAllowedError") or there is no microphone.
 */
export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
  });
  const context = new AudioContext();
  const close = () => {
    stream.getTracks().forEach((track) => track.stop());
    void context.close();
  };
  try {
    const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: "text/javascript" }));
    try {
      await context.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    const chunks: Float32Array[] = [];
    const node = new AudioWorkletNode(context, "fabulka-capture", { numberOfInputs: 1, numberOfOutputs: 0 });
    let flushed: (() => void) | null = null;
    node.port.onmessage = (event: MessageEvent<{ samples: Float32Array; last: boolean }>) => {
      if (event.data.samples.length) chunks.push(event.data.samples);
      if (event.data.last) flushed?.();
    };
    context.createMediaStreamSource(stream).connect(node);
    // Created after awaiting the microphone, the context may have lost the click and start suspended.
    await context.resume();
    return {
      async stop() {
        // The last partial chunk comes back on the flush; a silent worklet must not hang the stop.
        await new Promise<void>((resolve) => {
          flushed = resolve;
          node.port.postMessage("flush");
          setTimeout(resolve, 500);
        });
        close();
        return { chunks, sampleRate: context.sampleRate };
      },
      cancel: close,
    };
  } catch (error) {
    close();
    throw error;
  }
}
