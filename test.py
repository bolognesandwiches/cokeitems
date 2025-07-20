#!/usr/bin/env python3
"""
Background Remover Script
Removes background from images using AI models
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image
import rembg

def remove_background(input_path, output_path=None, model_name='u2net'):
    """
    Remove background from an image
    
    Args:
        input_path (str): Path to input image
        output_path (str): Path to save output image (optional)
        model_name (str): Model to use for background removal
    
    Returns:
        str: Path to output image
    """
    
    # Validate input file
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Generate output path if not provided
    if output_path is None:
        input_file = Path(input_path)
        output_path = input_file.parent / f"{input_file.stem}.png"
    
    print(f"Processing: {input_path}")
    print(f"Model: {model_name}")
    
    try:
        # Open input image
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()
        
        # Remove background using the correct API
        from rembg import new_session
        session = new_session(model_name)
        output_data = rembg.remove(input_data, session=session)
        
        # Save output image
        with open(output_path, 'wb') as output_file:
            output_file.write(output_data)
        
        print(f"Background removed successfully!")
        print(f"Output saved to: {output_path}")
        return str(output_path)
        
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def batch_remove_background(input_dir, output_dir=None, model_name='u2net'):
    """
    Remove background from all images in a directory
    
    Args:
        input_dir (str): Directory containing input images
        output_dir (str): Directory to save output images (optional)
        model_name (str): Model to use for background removal
    """
    
    input_path = Path(input_dir)
    if not input_path.exists():
        raise FileNotFoundError(f"Input directory not found: {input_dir}")
    
    # Create output directory
    if output_dir is None:
        output_path = input_path / "no_background"
    else:
        output_path = Path(output_dir)
    
    output_path.mkdir(exist_ok=True)
    
    # Supported image formats
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    
    # Process all images in directory
    processed_count = 0
    for file_path in input_path.iterdir():
        if file_path.suffix.lower() in image_extensions:
            output_file = output_path / f"{file_path.stem}.png"
            result = remove_background(str(file_path), str(output_file), model_name)
            if result:
                processed_count += 1
    
    print(f"\nBatch processing complete!")
    print(f"Processed {processed_count} images")
    print(f"Output directory: {output_path}")

def list_available_models():
    """List all available rembg models"""
    models = [
        'u2net',           # General purpose
        'u2netp',          # Lightweight version
        'u2net_human_seg', # Human segmentation
        'silouette',       # Silhouette detection
        'isnet-general-use' # High quality general use
    ]
    
    print("Available models:")
    for model in models:
        print(f"  - {model}")
    print("\nRecommended:")
    print("  - u2net: Best for general images")
    print("  - u2net_human_seg: Best for photos with people")
    print("  - isnet-general-use: Highest quality (slower)")

def main():
    parser = argparse.ArgumentParser(description="Remove background from images using AI")
    parser.add_argument('input', help='Input image file or directory')
    parser.add_argument('-o', '--output', help='Output file or directory')
    parser.add_argument('-m', '--model', default='u2net', 
                       help='Model to use (default: u2net)')
    parser.add_argument('-b', '--batch', action='store_true',
                       help='Process all images in directory')
    parser.add_argument('--list-models', action='store_true',
                       help='List available models')
    
    args = parser.parse_args()
    
    if args.list_models:
        list_available_models()
        return
    
    try:
        if args.batch or os.path.isdir(args.input):
            batch_remove_background(args.input, args.output, args.model)
        else:
            remove_background(args.input, args.output, args.model)
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()