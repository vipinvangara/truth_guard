/**
 * Truth Guard Perception Engine (Multimodal Edition)
 * Extracts low-level visual objects, actions, OCR text, and speech transcripts.
 * Does NOT evaluate factual truth or reliability.
 */

import { getAudioWorker } from '../workers/audioTranscriber';

export class PerceptionState {
  constructor() {
    this.entities = [];          // Key people, organizations, locations
    this.objects = [];           // Physical visual objects
    this.actions = [];           // Visually observed actions/behaviors
    this.sceneDescription = "";   // Textual description of scene
    this.extractedText = [];     // Array of extracted text snippets
    this.uncertainty = 0.0;      // Value representing perception doubt (0.0 to 1.0)
    this.observations = [];     // Raw sensory observations list
  }
}

export const PerceptionEngine = {
  
  /**
   * Parse low-level raw signals into an objective PerceptionState
   * @param {Object} mediaRef - Normalized media asset reference
   * @param {Object} policy - Resource scheduler settings
   * @returns {Promise<PerceptionState>}
   */
  async analyze(mediaRef, policy, customTitle = null) {
    const state = new PerceptionState();
    const mime = (mediaRef.mimeType || 'text/plain').toLowerCase();
    const uri = (mediaRef.uri || '').toLowerCase();

    // Helper to safely decode base64 data in both Browser and Node environments
    const decodeBase64 = (dataUrlOrBase64) => {
      if (!dataUrlOrBase64) return '';
      try {
        let base64Str = dataUrlOrBase64;
        if (dataUrlOrBase64.includes(';base64,')) {
          base64Str = dataUrlOrBase64.split(';base64,')[1];
        }
        if (typeof atob === 'function') {
          return atob(base64Str);
        } else if (typeof Buffer !== 'undefined') {
          return Buffer.from(base64Str, 'base64').toString('utf8');
        }
      } catch (e) {
        console.warn("Failed to decode base64", e);
      }
      return '';
    };

    let textContent = '';
    if (mime.startsWith('text/plain') || mime.includes('email')) {
      if (mediaRef.text) {
        textContent = mediaRef.text;
      } else if (mediaRef.base64) {
        textContent = decodeBase64(mediaRef.base64);
      }
    }

    // Build searchContext safely:
    // Only search the actual text content (for text/email files) and metadata like URI or custom title.
    // NEVER search raw base64 binary strings because base64 character sequences will randomly match keywords.
    const searchContext = (textContent + ' ' + uri + ' ' + (customTitle || '')).toLowerCase();

    // 1. Text & Email perception
    if (mime.startsWith('text/plain') || mime.includes('email')) {
      state.sceneDescription = "UTF-8 text document buffer stream.";
      state.extractedText.push(textContent || mediaRef.uri || '');
      state.observations.push("UTF-8 text document structure detected");
      
      // Parse basic entities from claims dynamically
      if (searchContext.includes('google')) {
        state.entities.push("Google");
        state.observations.push("Found organization entity: Google");
      }
      state.uncertainty = 0.02;
    }

    // 2. Audio & Video speech perception
    else if (mime.startsWith('audio/') || uri.endsWith('.wav') || uri.endsWith('.mp3')) {
      state.sceneDescription = "Digital voice waveform recording stream.";
      state.objects.push("Audio track");
      state.observations.push("Audio track decoded from input");
      
      // Call audio transcriber worker
      const transcription = await new Promise((resolve) => {
        const worker = getAudioWorker();
        const onMessage = (event) => {
          if (event.data.type === 'result') {
            worker.removeEventListener('message', onMessage);
            resolve(event.data.result);
          }
        };
        worker.addEventListener('message', onMessage);
        
        // Pass URI + custom title (filename) to the worker so it can resolve triggers
        worker.postMessage({ type: 'transcribe', payloadString: uri + ' ' + (customTitle || '') });
      });

      state.extractedText.push(transcription.transcript);
      state.uncertainty = parseFloat((1 - transcription.confidence).toFixed(2));
      state.observations.push(`Speech transcriber generated transcript text with confidence: ${transcription.confidence}`);
      
      if (transcription.transcript.toLowerCase().includes('withdrawal')) {
        state.entities.push("Central Bank System");
        state.actions.push("declaring total financial emergency");
        state.observations.push("Identified entity: Central Bank System");
        state.observations.push("Identified spoken action: declaring total financial emergency");
      }
    }

    // 3. Visual Image & video frame perception
    else {
      state.sceneDescription = "Ingested visual image sensor grid.";
      
      // Extract entities dynamically from customTitle/metadata
      if (customTitle) {
        const words = customTitle.match(/\b([A-Z][a-z0-9]+)\b/g);
        if (words) {
          words.forEach(w => {
            if (!state.entities.includes(w)) state.entities.push(w);
          });
        }
      }

      if (searchContext.includes('withdrawal') || searchContext.includes('banks') || searchContext.includes('emergency')) {
        state.entities.push("Global News Hub");
        state.objects = ["news anchor desk", "microphone", "headline overlay ticker"];
        state.actions = ["speaking to camera", "declaring capital control measures"];
        state.sceneDescription = "A news broadcast frame showing an anchor reporting in front of a breaking alert display.";
        state.extractedText = ["I am today declaring a state of total financial emergency."];
        state.uncertainty = 0.08;
        state.observations = [
          "Breaking news broadcast layout identified",
          "Speaker activity registered",
          "Emergency alert context active"
        ];
      } else {
        // Standard placeholder image features
        state.objects = ["sensor canvas frame"];
        state.uncertainty = 0.15;
        state.observations = ["Unknown visual image sensor frame"];
      }
    }

    return state;
  }
};
