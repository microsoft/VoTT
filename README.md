# CNTK Object Detection Video Tagging Tool

This tool provides end to end support for generating datasets for and validating Object Detection Models with CNTK.

It supports the following scenarios:

- Computer Assisted Tagging and Tracking of Objects In Video Using Custom implementation of [Camshift tracking algorithm](http://opencv.jp/opencv-1.0.0_org/docs/papers/camshift.pdf) 
- Exporting Tags to CNTK format for training a CNTK object recognition model.
- Running and validating a trained CNTK object recognition model on new videos to generate stronger models. (Windows only for now, GPU recommended)

## Table of Contents
 - [Prerequisites](#prerequisites)
 - [Tagging Job](#taggingjob)
 - [Review/Iterate CNTK Object Detection Model](#review)
 - [Upcoming Features](#upcoming)
 
<a name="prerequisites"></a>
## Prerequisites
**Please Note that installation of CNTK and the FAST-RCNN dependencies is only required for CNTK model review and training, not tagging**

 1. Install [CNTK](https://github.com/Microsoft/CNTK/wiki/Setup-CNTK-on-your-machine) (*Note: currently the tool only supports the non-pip/full installation of CNTK.*)
 2. Follow the setup instruction of the [CNTK Fast-RCNN tutorial](https://github.com/Microsoft/CNTK/wiki/Object-Detection-using-Fast-R-CNN#setup) (*Note: Fast-RCNN  is only supported for Linux with python 3.4 and not 3.5*)
 3. Download and Extract the app [release package](https://github.com/CatalystCode/CNTK-Object-Detection-Video-Tagging-Tool/releases)
 4. Configure CNTK-Config.json with the following properties
 
  ```json
   {
    "cntkPath" : "{CNTK Path default is c:/local/cntk}", 
   }
  ```
 5. Run the app
  
<a name="taggingjob"></a>
## Tagging Job 
 1. Load a mp4 video file by either dragging it into the app or clicking and selecting it.
  
  <img src="/media/2_load.jpg" alt="Home Page" height="300" width="500"/>
   
 2. Configure the tagging job specifying the following preferences
 
    - Frame Extraction Rate: The number of frames to tag per a second of video.
    - Tagging Region Type:  The type of bounding box for tagging regions.
       - "Rectangle": Tag bounding boxes of any dimension.
       - "Square": Tag bounding boxes of auto-fixed dimensions.
       - "Point": Tag a point (This is useful for object recognition but not object detection)
    - Export Frames Until: How far will the export operation proceed.
       - "Last Tagged Region": Exports frames up until the last frame that contain tags.
       - "Last Visited Frame": Exports frames up until the last frame that the user explicitly visited.
       - "Last Frame": Exports all video frames.
    - Output directory: Directory path for exporting training data.
    - Model Path: File path of the trained Fast-RCNN model file (Optional). 
    - Labels: The labels of the tagged regions (Ex. Cat, Dog, Horse, Person).
 
  <img src="/media/3_Job_Configuration.jpg" alt="Home Page" height="300" width="500"/>
 
 3. Tag the video frame by frame.
 
  <img src="/media/4_Tagging_Job.jpg" alt="Home Page" height="300" width="500"/>

 4. Export Video to CNTK Format using Menu or Ctrl/Cmd + E
 
  <img src="/media/5_Export.jpg" alt="Home Page" height="300" width="500"/>

<a name="review"></a>
## Review/Iterate CNTK Object Detection Model 
 1. Train model using [Object Detection using FastRCNN](https://github.com/Microsoft/CNTK/wiki/Object-Detection-using-Fast-R-CNN#train-on-your-own-data)<br> **Note: The data is already in CNTK format you do not have to run C1_DrawBboxesOnImages.py or C2_AssignLabelsToBboxes.py, currently the tool does not auto generate a "testImages" directory**
 2. Load new video that the model hasn't been trained on.
 3. Configure the tagging job specifying the following preferences
 4. Apply model to new video using Ctrl/Cmd + R
 5. When model finishes processing, validate tags, re-export, retrain
 6. Repeat step #1 on new videos until model performance is satisfactory.  

<a name="upcoming"></a>
## Upcoming Features 
- Image Directory Tagging Support
- Tagging Project Management 

-----------
<a name="Contribute"></a> 
<H3>Contribute</H3>
You are welcome to send us any bugs you may find, suggestions, or any other comments.
Before sending anything, please go over the repository issues list, just to make sure that it isn't already there.

You are more than welcome to fork this repository and send us a pull request if you feel that what you've done should be included.
