/**
 * Truth Guard Content Understanding Service
 * Orchestrates high-level scene descriptions, dense captioning, and
 * visual region-level analysis of ingested media payloads.
 */

import { getVlmWorker } from '../workers/vlmWorker';
import { featureStore } from './featureStore';

export const ContentUnderstandingService = {
  
  /**
   * Run semantic scene understanding on the media asset
   * @param {Object} mediaRef
   * @param {Object} policy
   * @param {string} customTitle
   * @param {boolean} consensusAuthorized
   * @param {string} geminiApiKey
   * @returns {Promise<Object>} scene understanding output
   */
  async process(mediaRef, policy, customTitle = null, consensusAuthorized = false, geminiApiKey = '') {
    const hash = mediaRef.contentHash || `hash-${Date.now()}`;
    
    // Check feature cache
    const cached = featureStore.getFeature(hash, 'scene');
    if (cached) return cached;

    // 1. If Consensus Mode is authorized and Gemini API Key is provided, call cloud VLM
    const mime = (mediaRef.mimeType || '').toLowerCase();
    const isImage = mime.startsWith('image/') || (mediaRef.uri && (mediaRef.uri.endsWith('.jpg') || mediaRef.uri.endsWith('.jpeg') || mediaRef.uri.endsWith('.png') || mediaRef.uri.endsWith('.webp') || mediaRef.uri.startsWith('webcam://')));
    
    if (consensusAuthorized && geminiApiKey && mediaRef.base64 && isImage) {
      try {
        console.log("Ingesting image using Cloud VLM Consensus API (Gemini)...");
        const base64Data = mediaRef.base64.split(';base64,')[1] || mediaRef.base64;
        const mimeType = mediaRef.mimeType || 'image/jpeg';
        
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: "Analyze this image and describe it in detail. Provide: 1. A detailed description of the overall scene, background context, and any characters/people inside (describe their clothing, actions, and expressions in detail). 2. A list of key visual objects. 3. A list of observed activities. Format your response strictly as a JSON object with keys 'scene' (string), 'objects' (array of strings), and 'activities' (array of strings). Do not include markdown code block formatting (like ```json) in your response, just return the raw JSON string."
                  },
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const json = await response.json();
        const text = json.candidates[0].content.parts[0].text;
        
        let cleanText = text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        }
        
        const result = JSON.parse(cleanText);

        const report = {
          scene: result.scene || "No description generated.",
          objects: result.objects || [],
          activities: result.activities || [],
          denseCaptions: [],
          regionAnalysis: [],
          throttled: false
        };
        featureStore.setFeature(hash, 'scene', report);
        return report;
      } catch (err) {
        console.warn("Consensus Cloud API vision query failed. Falling back to local VLM:", err);
      }
    }

    // 2. Local fallback
    if (!policy.runHeavyVLM) {
      // Return a lightweight baseline report under resources stress
      const fallbackReport = {
        scene: customTitle ? `Ingested visual asset (${customTitle}) under resource conservation.` : "Ingested media file stream under low-battery resource conservation.",
        objects: ["media payload"],
        activities: ["quarantined-level review"],
        denseCaptions: [],
        regionAnalysis: [],
        throttled: true
      };
      featureStore.setFeature(hash, 'scene', fallbackReport);
      return fallbackReport;
    }

    return new Promise((resolve) => {
      const worker = getVlmWorker();
      
      const onMessage = (event) => {
        if (event.data.type === 'result') {
          worker.removeEventListener('message', onMessage);
          const res = event.data.result;
          const report = {
            scene: res.scene,
            objects: res.objects || [],
            activities: res.activities || [],
            denseCaptions: res.denseCaptions || [],
            regionAnalysis: res.regionAnalysis || [],
            throttled: false
          };
          featureStore.setFeature(hash, 'scene', report);
          resolve(report);
        }
      };

      worker.addEventListener('message', onMessage);
      
      // Dispatch payload details to background VLM model
      worker.postMessage({
        type: 'infer',
        imageUri: mediaRef.uri || '',
        payloadString: (customTitle || '') + ' ' + (mediaRef.contentHash || '') + ' ' + (mediaRef.uri || ''),
        filename: customTitle || '',
        prompt: "Describe what is in the image. Give objects, activities, bounding boxes, and region descriptions."
      });
    });
  }
};
