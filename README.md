# CNTK Video Tagging Tool for Object Detection

The CNTK Object Detection Video Tagging Tool provides end to end support for generating datasets and validating Object Detection Models.

**End To End Object Detection Pipeline**
![detection In a box](media/detectioninabox.jpg)

**The tool supports the following features:**

- Computer assisted tagging and tracking of objects in videos using the [Camshift tracking algorithm](http://opencv.jp/opencv-1.0.0_org/docs/papers/camshift.pdf).
- Exporting tags and assets to CNTK format for training a CNTK object detection model.
- Running and validating a trained CNTK object detection model on new videos to generate stronger models. 

## Table of Contents
 - [Installation](#installation)
 - [How to tag a video](#taggingjob)
 - [How to Review & Improve a CNTK Object Detection Model](#review)
 - [Upcoming Features](#upcoming)
 - [How to Contribute](#contribute)
 
-----------
<a name="installation"></a>
## Installation
 

**Installing the Video Tagging Tool**
 
 1. Download and Extract the app [release package](https://github.com/CatalystCode/CNTK-Object-Detection-Video-Tagging-Tool/releases)
 2. Configure CNTK-Config.json (which resides in the main directory of the tagging tool) with the following properties to enable the model review feature. 
 
  ```json
   {
    "cntkPath" : "{CNTK Path default is c:/local/cntk}", 
   }
  ```
 3. Run the app
 
 **Installing CNTK with the FRCNN prequisites**
 
 *Please note that installation of CNTK and FAST-RCNN dependencies are optional for taggin and are only required for CNTK model review and training.*
 
1. Install [CNTK](https://github.com/Microsoft/CNTK/wiki/Setup-CNTK-on-your-machine) (*Note: currently the tool only supports the full installation method (non pip) of CNTK.*)
 2. Follow the setup instructions of the [CNTK Fast-RCNN tutorial](https://github.com/Microsoft/CNTK/wiki/Object-Detection-using-Fast-R-CNN#setup) (*Note: Fast-RCNN currently only supports Linux python version 3.4 and not 3.5*)
 
 
-----------
<a name="taggingjob"></a>
## How to tag a video 
 1. Load a mp4 video file by either dragging it into the app or clicking and selecting it.
  
    <img src="/media/2_load.jpg" alt="Home Page" height="426" width="695"/>
   
 2. Configure the tagging job specifying the following preferences
 
    <img src="/media/3_Job_Configuration.jpg" alt="Home Page" height="586" width="685"/>
 
    **Frame Extraction Rate:** The number of frames to tag per a second of video.<br>
    
    **Tagging Region Type:**  The type of bounding box for tagging regions.<br>
      - "Rectangle": Tag bounding boxes of any dimension.
      - "Square": Tag bounding boxes of auto-fixed dimensions.
      
    **Export Frames Until:** How far into the video the export operation will proceed.<br>
      - "Last Tagged Region": Exports frames up until the last frame that contain tags.
      - "Last Visited Frame": Exports frames up until the last frame that the user explicitly visited.
      - "Last Frame": Exports all video frames.
      
    **Output directory:** Directory path for exporting training data.<br>
    
    **Model Path:** File path of the trained Fast-RCNN model file (Optional).<br>
    
    **Labels:** The labels of the tagged regions (Ex. Cat, Dog, Horse, Person).<br>
  
 3. Tag the video frame by frame.
 
    <img src="/media/4_Tagging_Job.jpg" alt="Home Page" height="586" width="685"/>
    
    **Tagging**: To add a region to a frame, simply click and drag a bounding box around the desired area. Then move or resize the region till it perfectly fits a desired object.
     - Selected regions appear as red ![red](https://placehold.it/15/f03c15/000000?text=+) and unselected regions will appear as blue ![#1589F0](https://placehold.it/15/1589F0/000000?text=+).
     - A tag can be assigned to a region by clicking on a region and selecting the desired tag from the label toolbar at the bottom of the tagging control. 
     - Click the ![cleartags](media/cleartags.png) button to clear all tags on a given frame.  
    
    **Navigation**: Users can navigate between video frames by using either the ![prev-nxt](media/prev-next.png) buttons, the left and right arrow keys, or the video skip bar.
     - Tags are auto saved each time a frame is changed. 
    
    **Tracking**: New regions are tracked by default until a given scene changes. 
     - To toggle tracking on and off use the file menu setting or the keyboard shortcut Ctrl/Cmd + T.    
    
 4. Export Video to CNTK Format using Menu or Ctrl/Cmd + E
    
    **Note on Export the tool reserves a random 20% sample of the tagged frames as a test set.**
    <img src="/media/5_Export.jpg" alt="Home Page" height="586" width="685"/>

-----------
<a name="review"></a>
## How to Review & Improve a CNTK Object Detection Model
 1. Train model with [Object Detection using FastRCNN](https://github.com/Microsoft/CNTK/wiki/Object-Detection-using-Fast-R-CNN#train-on-your-own-data)<br> **Note: The data is already in CNTK format you do not have to run C1_DrawBboxesOnImages.py or C2_AssignLabelsToBboxes.py**
 2. Load a new video that the model has not been trained on.
 3. Configure the tagging job specifying the following preferences
 4. Apply model to new video using Ctrl/Cmd + R
 5. When the model finishes processing; validate tags, re-export and retrain
 6. Repeat step #1 on new videos until model performance is satisfactory.  

-----------
<a name="upcoming"></a>
## Upcoming Features 
- Image Directory Tagging Support
- Tagging Project Management 

-----------
<a name="contribute"></a> 
## How to Contribute
You are welcome to send us any bugs you may find, suggestions, or any other comments.
Before sending anything, please go over the repository issues list, just to make sure that it isn't already there.

You are more than welcome to fork this repository and send us a pull request if you feel that what you've done should be included.
