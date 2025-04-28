# Parallax Manager

## Overview
Parallax Manager is a script for creating dynamic, device-responsive parallax effects in Lens Studio. The script allows you to create multi-layered backgrounds that respond to device movement, creating a sense of depth and immersion in your scene.

## Features
- Device-responsive parallax effect based on phone rotation
- Support for multiple layers with independent parallax factors
- Configurable edge behavior (wrap-around or constrained)
- Adjustable movement smoothing for natural transitions
- Speed control to fine-tune responsiveness
- Position constraints to limit movement range

## Usage Guide

### Basic Setup
1. Create multiple image layers in your scene (foreground, midground, background, etc.)
2. Configure the Parallax Manager script:
   - Link your device tracking object
   - Add each layer's Screen Transform to the Layer Transforms array
   - Set parallax factors for each layer (typically higher values for foreground elements, lower for background)

### Parallax Factors
The parallax factors determine how much each layer moves relative to device rotation:
- Higher values create more movement (good for foreground elements)
- Lower values create less movement (good for background elements)
- Typical range is 0.1 (distant background) to 2.0 (close foreground)

### Edge Behavior
- With **Wrap at Edges** enabled, layers will seamlessly wrap around when they reach screen edges
- With **Wrap at Edges** disabled, layers will stop at the defined min/max positions

### Fine-Tuning
- Use the **Smoothing** slider to adjust how responsively layers follow device movement
- Adjust the **Speed Multiplier** to control overall sensitivity
- Set **Min X** and **Max X** values to control how far layers can move

## Troubleshooting
- If layers aren't moving, check device tracking rotation is properly configured
- If movement feels jerky, increase the Smoothing value
- If layers move too much/little, adjust the Speed Multiplier
- If you see unexpected gaps, your Min/Max X values may need adjustment

## Advanced Usage
The Parallax Manager exposes an API for external scripts:
```javascript
// Reset all layers to their initial positions
someScriptWithReference.api.resetLayers();
```

## Credits
Developed by Owais Iqbal

