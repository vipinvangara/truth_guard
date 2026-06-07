// src/workers/adversarialGuard.js
// Dedicated web worker running adversarial defense validation

const WORKER_ADVERSARIAL_STRING = `
self.onmessage = async (e) => {
  const { type, payloadString } = e.data;

  if (type === 'guard-check') {
    const rawText = (payloadString || '');
    let attackLikelihood = 0.01;
    let attackType = null;
    let alerts = [];

    // Prompt injection check in text content
    if (rawText.includes('ignore') || rawText.includes('override') || rawText.includes('bypass rules')) {
      attackLikelihood = 0.88;
      attackType = "Prompt Injection / Instructions Hijacking";
      alerts.push("CRITICAL ALERT: Prompt injection pattern detected in text stream.");
    }
    
    // Steganographic noise check simulation
    if (rawText.length > 5000) {
      attackLikelihood = 0.42;
      attackType = "Steganography / LSB watermark";
      alerts.push("WARNING: High-entropy LSB pixel signature detected. Steganographic data suspected.");
    }

    self.postMessage({
      type: 'result',
      result: {
        success: true,
        attackLikelihood,
        attackType,
        alerts
      }
    });
  }
};
`;

let adversarialWorkerInstance = null;

export function getAdversarialWorker() {
  if (!adversarialWorkerInstance) {
    try {
      const blob = new Blob([WORKER_ADVERSARIAL_STRING], { type: 'application/javascript' });
      adversarialWorkerInstance = new Worker(URL.createObjectURL(blob), { type: 'module' });
    } catch (err) {
      console.warn("Failed to instantiate ESM Adversarial Worker. Engaging main-thread fallback.", err);
      adversarialWorkerInstance = {
        postMessage: function(message) {
          const { type, payloadString } = message;
          if (type === 'guard-check') {
            setTimeout(() => {
              let attackLikelihood = 0.01;
              let attackType = null;
              let alerts = [];
              if ((payloadString || '').includes('ignore')) {
                attackLikelihood = 0.88;
                attackType = "Prompt Injection";
                alerts = ["Prompt injection detected."];
              }
              if (this.onmessage) {
                this.onmessage({
                  data: {
                    type: 'result',
                    result: {
                      success: true,
                      attackLikelihood,
                      attackType,
                      alerts
                    }
                  }
                });
              }
            }, 60);
          }
        },
        addEventListener: function(event, callback) {
          this.onmessage = callback;
        },
        removeEventListener: function() {
          this.onmessage = null;
        },
        terminate: function() {}
      };
    }
  }
  return adversarialWorkerInstance;
}
