import os
import logging
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantizationWorkspace")

def quantize_model(input_model_path, output_model_path):
    if not os.path.exists(input_model_path):
        logger.error(f"Input model file not found at: {input_model_path}")
        logger.info("Please make sure you exported the model using: optimum-cli export onnx ...")
        return

    # Delete existing model-inferred.onnx if present to prevent WinError 32
    inferred_path = os.path.join(os.path.dirname(input_model_path), "model-inferred.onnx")
    if os.path.exists(inferred_path):
        try:
            logger.info(f"Removing existing inferred model: {inferred_path}")
            os.remove(inferred_path)
        except Exception as e:
            logger.warning(f"Could not remove {inferred_path}: {e}")

    logger.info(f"Applying dynamic INT8 quantization targeting output path: {output_model_path}")
    
    # Quantize the model (dynamic quantization scales weights to signed INT8 on CPU Execution Provider)
    try:
        quantize_dynamic(
            model_input=input_model_path,
            model_output=output_model_path,
            weight_type=QuantType.QInt8
        )
        logger.info("Quantization process completed.")
        
        # Verify the quantized model size
        orig_size = os.path.getsize(input_model_path) / (1024 * 1024)
        quant_size = os.path.getsize(output_model_path) / (1024 * 1024)
        logger.info(f"Original model size: {orig_size:.2f} MB")
        logger.info(f"Quantized model size: {quant_size:.2f} MB (Reduction: {(1 - quant_size/orig_size)*100:.1f}%)")
        logger.info("Quantized model is ready for mobile deployment underassets/models/model_quantized.onnx")
    except Exception as e:
        logger.error(f"Quantization process failed: {e}")

if __name__ == "__main__":
    input_path = "onnx_model/model.onnx"
    output_path = "assets/models/model_quantized.onnx"
    
    # Ensure destination directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    quantize_model(input_path, output_path)
