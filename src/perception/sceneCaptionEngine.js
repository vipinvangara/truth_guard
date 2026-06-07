/**
 * Truth Guard Scene Caption Engine
 * Specialized local scene description engine using Florence-2 / Moondream2.
 */

import { InferenceBus } from '../runtime/inferenceBus';

export const SceneCaptionEngine = {
  /**
   * Describe visual layout of media
   * @param {Object} mediaRef
   * @param {string} priority
   * @returns {Promise<Object>} Scene captioning results (scene, objects, activities)
   */
  async caption(mediaRef, priority = 'medium', consensusAuthorized = false, geminiApiKey = '') {
    const mime = (mediaRef.mimeType || '').toLowerCase();
    const isImage = mime.startsWith('image/') || (mediaRef.uri && (mediaRef.uri.endsWith('.jpg') || mediaRef.uri.endsWith('.jpeg') || mediaRef.uri.endsWith('.png') || mediaRef.uri.endsWith('.webp') || mediaRef.uri.startsWith('webcam://')));

    if (consensusAuthorized && geminiApiKey && mediaRef.base64 && isImage) {
      try {
        console.log("SceneCaptionEngine: Ingesting image using Cloud VLM Consensus API (Gemini)...");
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

        if (response.ok) {
          const json = await response.json();
          const text = json.candidates[0].content.parts[0].text;
          
          let cleanText = text.trim();
          if (cleanText.startsWith('```')) {
            cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
          }
          
          const result = JSON.parse(cleanText);
          return {
            scene: result.scene || "No description generated.",
            objects: result.objects || [],
            activities: result.activities || []
          };
        } else {
          console.warn(`SceneCaptionEngine: Gemini API returned status ${response.status}. Falling back to local offline.`);
        }
      } catch (err) {
        console.warn("SceneCaptionEngine: Consensus Cloud API vision query failed. Falling back to local offline:", err);
      }
    }

    const payload = {
      imageUri: mediaRef.uri || '',
      payloadString: mediaRef.base64 || mediaRef.contentHash || mediaRef.uri || '',
      text: mediaRef.text || ''
    };

    try {
      const result = await InferenceBus.enqueue('florence2-base', payload, { priority });
      return result || { scene: "Workspace overview.", objects: [], activities: [] };
    } catch (err) {
      console.warn("SceneCaptionEngine: Local captioning failed, falling back:", err);
      return {
        scene: "Visual workspace log check.",
        objects: [],
        activities: []
      };
    }
  }
};
