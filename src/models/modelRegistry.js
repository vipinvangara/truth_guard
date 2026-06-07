/**
 * Truth Guard Model Registry
 * Tracks and validates model signatures, quantization settings, and capabilities
 * to ensure execution reproducibility and device-aware loading.
 */

export const ModelRegistry = {
  vlm: {
    id: 'smolvlm-q4-onnx',
    name: 'SmolVLM-Instruct-Quantized',
    version: '1.0.2',
    quantization: 'q4',
    checksum: 'sha256-4a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b',
    sizeBytes: 1850000000, // ~1.85 GB
    capabilities: ['scene-understanding', 'dense-captioning', 'region-analysis'],
    engine: 'ONNX-Runtime-WebGPU'
  },
  ocr: {
    id: 'ocr-lite-wasm',
    name: 'Tesseract-Lite-WASM',
    version: '3.0.0',
    quantization: 'wasm-compiled',
    checksum: 'sha256-8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d',
    sizeBytes: 15400000, // ~15.4 MB
    capabilities: ['text-extraction', 'phishing-pattern-check'],
    engine: 'WASM'
  },
  forensics: {
    id: 'double-jpeg-onnx',
    name: 'Double-JPEG-Forensic-CNN',
    version: '0.8.0',
    quantization: 'fp16',
    checksum: 'sha256-e9f0a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9',
    sizeBytes: 45000000, // ~45 MB
    capabilities: ['compression-mismatch', 'resampling-grid'],
    engine: 'ONNX-Runtime-WASM'
  },
  adversarial: {
    id: 'adversarial-guard-cnn',
    name: 'Adversarial-Guard-Robust-CNN',
    version: '0.5.0',
    quantization: 'fp16',
    checksum: 'sha256-d8c7b6a5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7',
    sizeBytes: 12000000, // ~12 MB
    capabilities: ['steganography-detection', 'perturbation-index'],
    engine: 'ONNX-Runtime-WASM'
  }
};

export function getModelMetadata(modelType) {
  return ModelRegistry[modelType] || null;
}

export function validateModelChecksum(modelType, localChecksum) {
  const model = ModelRegistry[modelType];
  if (!model) return false;
  return model.checksum === localChecksum;
}
