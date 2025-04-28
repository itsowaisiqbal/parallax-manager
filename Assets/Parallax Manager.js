//@ui {"widget":"separator"}
//@input SceneObject deviceTrackingRotation

//@ui {"widget":"separator"}
//@input Component.ScreenTransform[] layerTransforms

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Parallax Factors"}
//@ui {"widget":"label", "label":"Adjust the parallax factors based on the layers positioning. Normally it goes highest for the front and lowest for the back."}
//@input float[] parallaxFactors

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Parallax Options"}
//@input bool wrapAround = true {"label":"Wrap at Edges"}
//@input float smoothingFactor = 0.1 {"widget":"slider", "min":0.0, "max":1.0, "step":0.01, "label":"Smoothing"}
//@input float speedMultiplier = 1.0 {"widget":"slider", "min":0.1, "max":5.0, "step":0.1, "label":"Speed Multiplier"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Edge Constraints"}
//@ui {"widget":"label", "label":"Adjust the min and max x based on the X axis of your layers"}
//@input float minXClamp = -1.0 {"label":"Min X Position"}
//@input float maxXClamp = 1.0 {"label":"Max X Position"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Debug Options"}
//@input bool debugMode = false {"label":"Show Debug Logs"}

//@ui {"widget":"separator"}
//@ui {"widget":"label", "label":"Test Mode only there to test with and without parallax"}
//@input bool testMode = false {"label":"Test Mode"}

//@input Component.Text debugText

//variables
//variables to track continuous rotation
var previousRawYDeg = 0;
var accumulatedYDeg = 0;
var hasInitialReading = false;

//array for current and target offsets
var currentXOffset = [];
var targetXOffset = [];

//array to store initial positions
var initialPositions = [];

function Start() {

    if(script.testMode) {
        script.debugText.text = "Parallax Off"
    }
    else {
        script.debugText.text = "Parallax On"
    }
    
    //store initial positions and set current and target offsets to 0
    for (var i = 0; i < script.layerTransforms.length; i++) {
        initialPositions[i] = script.layerTransforms[i].anchors.getCenter();
        currentXOffset[i] = 0;
        targetXOffset[i] = 0;
    }
    
    //print debug info
    if (script.debugMode) print("Parallax Manager initialized with " + script.layerTransforms.length + " layers");
}

//function to normalize angle to -180 to 180
function normalizeAngle180(angle) {
    angle = angle % 360;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
}

//function to get y rotation degrees
function getYRotationDegrees(quatRot) {

    //extract y rotation from quaternion
    var forward = quatRot.multiplyVec3(vec3.forward());
    var yawRadians = Math.atan2(forward.x, forward.z);
    return normalizeAngle180(yawRadians * (180 / Math.PI));
}

//function to clamp a value between min and max
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

//update every frame
function Update() {

    var quatRot = script.deviceTrackingRotation.getTransform().getLocalRotation();
    
    //get y rotation
    var rawYDeg = getYRotationDegrees(quatRot);
    
    //track continuous horizontal rotation
    if (!hasInitialReading) {
        previousRawYDeg = rawYDeg;
        accumulatedYDeg = rawYDeg;
        hasInitialReading = true;
    } else {
        //process horizontal rotation
        var diffY = rawYDeg - previousRawYDeg;
        if (diffY > 180) diffY -= 360;
        if (diffY < -180) diffY += 360;
        
        //apply the speed multiplier to the rotation difference
        diffY *= script.speedMultiplier;
        
        accumulatedYDeg += diffY;
        
        //if wrap around is disabled, clamp the accumulated value to prevent "debt" accumulation
        if (!script.wrapAround) {
            accumulatedYDeg = Math.max(-180, Math.min(180, accumulatedYDeg));
        }
        
        previousRawYDeg = rawYDeg;
    }
    
    //use either wrapped or continuous rotation based on setting
    var yDeg = script.wrapAround ? rawYDeg : accumulatedYDeg;
    
    //apply the speed multiplier to yDeg if in wrap around mode
    if (script.wrapAround) {
        yDeg *= script.speedMultiplier;
        //clamp yDeg to prevent extreme values when speed is high
        yDeg = clamp(yDeg, -180, 180);
    }
    
    //apply parallax to all layers
    for (var i = 0; i < script.layerTransforms.length; i++) {
        //skip if we don't have a corresponding parallax factor
        if (i >= script.parallaxFactors.length) continue;
        
        //calculate horizontal offset
        var normalizedYRotation = yDeg / 180;
        
        //calculate target horizontal offset
        //if test mode is on, use 1.0 as parallax factor, otherwise use the parallax factor from the parallaxFactors array
        var parallaxFactor = script.testMode ? 1.0 : script.parallaxFactors[i];
        
        //map the normalized rotation [-1,1] to the full range of [minXClamp, maxXClamp]
        var rangeMidpoint = (script.maxXClamp + script.minXClamp) / 2;
        var rangeHalfWidth = (script.maxXClamp - script.minXClamp) / 2;
        
        //apply parallax factor to affect how much of the range is used
        var effectiveHalfWidth = rangeHalfWidth * (parallaxFactor / Math.max(1, Math.abs(parallaxFactor)));
        
        //calculate the target position using the full range
        targetXOffset[i] = rangeMidpoint + normalizedYRotation * effectiveHalfWidth;
        
        //ensure we don't exceed the boundaries
        targetXOffset[i] = clamp(targetXOffset[i], script.minXClamp, script.maxXClamp);
        
        //apply smoothing if enabled
        if (script.smoothingFactor > 0) {
            currentXOffset[i] = currentXOffset[i] + (targetXOffset[i] - currentXOffset[i]) * script.smoothingFactor;
        } else {
            currentXOffset[i] = targetXOffset[i];
        }
        
        //set position with updated offset, maintaining original Y position
        script.layerTransforms[i].anchors.setCenter(new vec2(
            currentXOffset[i], 
            initialPositions[i].y
        ));
    }
    
    //print debug info if enabled
    if (script.debugMode) {
        if (script.wrapAround) {
            print("Y Rotation (wrapped, speed-adjusted): " + yDeg.toFixed(2) + (script.testMode ? " - TEST MODE" : ""));
        } else {
            print("Y Rotation (clamped, speed-adjusted): " + accumulatedYDeg.toFixed(2) + (script.testMode ? " - TEST MODE" : ""));
        }
    }
}

//function to reset all layers to initial positions
function resetLayers() {
    for (var i = 0; i < script.layerTransforms.length; i++) {
        if (i < initialPositions.length) {
            script.layerTransforms[i].anchors.setCenter(initialPositions[i]);
            currentXOffset[i] = 0;
            targetXOffset[i] = 0;
        }
    }
    
    //reset rotation tracking
    hasInitialReading = false;
    
    //print debug info
    if (script.debugMode) print("Parallax layers reset to initial positions");
}

//expose reset function for external use
script.api.resetLayers = resetLayers;

script.createEvent("OnStartEvent").bind(Start);
script.createEvent("UpdateEvent").bind(Update);





