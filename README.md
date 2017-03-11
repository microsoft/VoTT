# CNTK Object Recognition Video Tagging Tool

This tool provides end to end support for generating datasets for and validating Object Recognition Models with CNTK.

It supports the following scenarios:

- Computer Assisted Tagging of Objects In Video Using Custom implementation of Camshift Algorithm
- Export Tags to CNTK format for training a CNTK object recognition model.
- Running and validating a trained CNTK object recognition model on new videos to generate stronger models. (Windows only for now, GPU recommended)

## To Use:
 1. Download the release binary.
 2. Extract and run the app
 3. Load a video.
 4. Configure the tagging job specifying the following preferences
    - Frame Extraction Rate (Number of frames to tag per a second)
    - Tagging Region Type (Rectangle, Point, Square)
    - Export Frames Until (How far to export)
    - Labels (Labels for tagging)
 5. Tag the video frame by frame.
 6. Export Video to CNTK Format
 7. Train model using [Object Detection using FastRCNN] (https://github.com/Microsoft/CNTK/wiki/Object-Detection-using-Fast-R-CNN).
 8. Load new video apply model to new video, validate tags, re-export, retrain
 9. Repeat step #8 on new videos until model preformance is satisfactory.  

## Upcoming Features
- Image Directory Tagging Support
- Tagging Project Management 
- UI enhancements 
