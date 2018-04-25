# VideoTagging Web Element
This web element can be used to annotate videos frame by frame. It is useful when building solutions for video processing  
and there's a need to curate labeled videos for training or testing a computer vision algorithm.

###General
  
The element displays a selected video and allows the user to associate regions and text tags per frame.
A `region` is a point or area within the frame, which can then be associated with textual `tags`.

A `region` is represented by a json object, with a structure that depends on the 'type' property.
Examples:  
1) { region: { type: 'point', x: 123, y: 54, radius: 15, tags: [ 'horse', 'brown'] }}  
2) { region: { type: 'rectangle', topLeft{ x: 123, y: 54 }, bottomRight: topLef{ x: 100, y: 10 }, tags: [ 'horse', 'brown'] 

}}

There are 2 region types:  
1) `Point` - designates an x,y coordinate (marked by an x).  
2) `Rectangle` - designates a rectangle (x1, y1, x2, y2)  

In addition, it is possible to define single or multiple regions per frame:  
1) `Single` - only one region can appear in a frame.  
2) `Multiple` - multiple regions can appear in a frame. 

Once a video has been loaded the control is ready for use:

![Alt text](assets/images/loaded.png?raw=true "Title")


###Video Controls:  

![Alt text](assets/images/videocontrols.png?raw=true "Title")

1) Video timebar.  
2) One frame back  
3) Play/Pause  
4) One frame forward  
5) Go to first untagged frame   
6) Frame number  
7) Play speed  
8) Current and remaining video time  
9) Mute button  
10) Volume slider  

To change the playback speed, click on the icon and select:

![Alt text](assets/images/playback.png?raw=true "Title")


###Tagging controls    

![Alt text](assets/images/taggingcontrols.png?raw=true "Title")
  
1) Tags - toggle the tags to add/remove a tag to/from a region. This is only possible when a region is selected.
   The selected tags are white.  
2) Empty frame - designates a frame as tagged when there are no regions.    
3) Lock tags - automatically adds selected tags to new regions. Toggle to enable/disable. 
     
      

###Usage  

Point/single - On a certain frame, click the video screen. Every click will move the region to a new one.  
Select tags for this region by clicking the tags below.:
![Alt text](assets/images/singlepoint.png?raw=true "Title")

Point/multiple - On a certain frame, click the video screen. Every click adds a new region:
![Alt text](assets/images/multipoints.png?raw=true "Title")

Rectangle single/multiple - Click the video screen and drag. A rectangle appears: 

![Alt text](assets/images/area.png?raw=true "Title")

To select a region, click on it.  
In all modes, when a region is selected, you can add/remove tags to it or delete it altogether.

Lock tags and Auto step - When the Mode is set to Single ("multitags="0"), the video will automatically advance 1 frame 
after a region has been created, so the work flow of a user is:  
     * Create a new region - Click or drag  
     * Select tags  
     * Click on the Lock Icon - turns to white.  
     * Create a region   
     * Repeat   
     * Click the icon again to exit this mode.   


###Technical  

The control is built using HTML5, CSS3 based on the [Polymer](https://www.polymer-project.org/1.0/) 
framework, allowing us to create reusable web components.
Area selection is credited to [ImageAreaSelect](http://odyniec.net/projects/imgareaselect/)

####Installing the control  
```
    bower install CatalystCode/video-tagging
```



####Hosting the control    
The control can be hosted in an HTML page. Add a reference to the element:
```
     <link rel="import" href="/video-tagging.html">
```
Add the element tag in the place you want the control to appear, wrapped in a div:
```
    <div style="width:50%">
        <video-tagging id='video-tagging'></video-tagging>
    </div>
```

A host project can be found in [VideoTaggingTool](https://github.com/CatalystCode/VideoTaggingTool.git) 

An additional demo can be found in the control library in demo/index.html,   
run with your favorite server.

####Control API    
The control receives and sends data from/to the host.   

#####Input Data     
The following properties must be populated:   

   * videoduration - number, for example 30.07  
   * videowidth - number, for example 420  
   * videoheight - number, for example 240  
   * framerate - number, for example 29.97  
   * regiontype - string, can be "point" or "rectangle"  
   * regionsize - number, for example 20 (in pixels) for point regions.  
   * multitags - string, can be "0" or "1"   
   * inputtagsarray - a string array of the possible tags, for example - ["horse", "bird]  
   * inputFrames - an object containing all the tagged frames of this video (That have been created at an earlier time).
      The object is a dictionary, the frame number is the key. Each frame has a collection of regions 
      and each region has a collection of tags.    
      In this example we see data for frames 434, 442 and 628.  
      ![Alt text](assets/images/frames1.png?raw=true "Title")  
      Expanded- each region is an object with coordinates and a tags array.  
      ![Alt text](assets/images/frames2.png?raw=true "Title")
  
   Assign these properties on the element, for example:
```
        var videotagging = document.getElementById('video-tagging');
                
        videotagging.videoduration = data.video.DurationSeconds;
        videotagging.videowidth = data.video.Width;
        videotagging.videoheight = data.video.Height;
        videotagging.framerate = data.video.FramesPerSecond;
```

      
  Finally, to load the control, set the src property to the URL of the video: 
```
        videotagging.src = data.video.Url;
```
        

#####Output Data       
When a region is created or updated and when tags are added/removed, the element fires an event called "onregionchanged". Register to this event to get the
data:
```
document.getElementById('video-tegging').addEventListener('onregionchanged', function (e) {...
```
        
The control sends **all** the regions and their tags in the current frame. The parameter e holds this data in e.detail:  

![Alt text](assets/images/frames3.png?raw=true "Title")

####Browser Support  

![Alt text](assets/images/chrome.png?raw=true "Title")  Chrome 47   
![Alt text](assets/images/ff.png?raw=true "Title")      Firefox 43 

It is recommended to use the same browser consistently as there are differences between them regarding video time calculations.
Better precision was observed in Firefox.

####License

[MIT](https://github.com/CatalystCode/video-tagging/blob/master/LICENSE) 
