/* Copyright 2017 http://steamcommunity.com/id/Aesignis/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

let canvas = null;
let ctx = null;

let bckCanvas = null;
let bckCtx = null;

let dotRingCanvas = null;
let dotRingCtx = null;

const POINT_SIZE = 2;
const HALF_POINT_SIZE = Math.ceil(POINT_SIZE / 2);

const VOLUME_POINT_SIZE = 3;
const HALF_VOLUME_POINT_SIZE = Math.ceil(HALF_POINT_SIZE / 2);

//user customizable
let ringRStartColor = [146, 230, 215];
let ringREndColor = [67, 169, 216];
let ringLStartColor = [237, 230, 128];
let ringLEndColor = [229, 169, 114]; //TODO LR orientation current
let rippleEnabled = true;
let enableFlat = false;
let backgroundColorCenter = [76, 99, 106]
let backgroundColorEdge = [51, 51, 51];
let sensitivity = 1;
let smoother = 0.5;

const dotRingColor = '#616161'
const volumeRingIdicator = '#4CAF50'
const white = "#fafafa";
const version = "Venom Sound";

let props;

let globalOpacityOverride = 0;

let logo;
let background;

let retAudioArray;

let leftAudioSide = null;
let rightAudioSide = null;

let preL = [];
let preR = [];
let current = 0;

let isSound = false;

let maxAudioValue = 0.1;

let opacity = 0; 
let direction = 1;
let min = 0.2;

let volumes = null;

let maxVolumeHeightL = 0;
let maxVolumeHeightR = 0;

let maxL = 0;
let maxR = 0;

let logoOpacity = 1;

let buckets = fillArray(0, 10)
let max_bucket_age = 1000;

let previous_index;

let customIconUrl = null;
let customIconWidth = 300;
let customIconHeight = 300;
let customIcon = null;
let hasIconLoaded = false;

let backgroundImageUrl = null;
let backgroundBlendMode = 1;
let backgroundImage = null;
let hasBackgroundLoaded = false;

let backgroundGrad = null;
let backgroundOpacity = 1.0;

let lastFrame;

let resolution = 128;

let backgroundInvalidated = false;

const TwoPi = 2 * Math.PI;
const HalfCirclePi = Math.PI / 180;

function sinf(value) {
    // 128 points between 0 and 2pi
    let index = Math.floor(value / TwoPi * resolution);

    return Math.sin(index / resolution * TwoPi);
}

function cosf(value) {
    // 128 points between 0 and 2pi
    let index = Math.floor(value / TwoPi * resolution);

    return Math.cos(index / resolution * TwoPi);
}

let fpsMeter = false;

window.onload = function () {
    canvas = document.getElementById("canvas");
    bckCanvas = document.getElementById("bckCanvas");
    dotRingCanvas = document.getElementById("dotRingCanvas");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    bckCanvas.width = window.innerWidth;
    bckCanvas.height = window.innerHeight;

    dotRingCanvas.width = window.innerWidth;
    dotRingCanvas.height = window.innerHeight;

    ctx = canvas.getContext('2d');
    bckCtx = bckCanvas.getContext('2d');
    dotRingCtx = dotRingCanvas.getContext('2d');

    logo = document.getElementById('logo')
    background = document.getElementById('wrapper');

    backgroundGrad = document.getElementById('wrapper');

    lastFrame = performance.now();

    main_animation();

    window.wallpaperRegisterAudioListener(wallpaperAudioListener);
    
    wallpaperAudioListener(fillArray(0,128));
}

window.wallpaperPropertyListener = {
    
    applyUserProperties: function(properties) {
        
        props = properties;
        
        if (properties.sensitivity) {
            sensitivity = properties.sensitivity.value;
        }
        
        if (properties.smooth) {
            smoother = properties.smooth.value;
        }
                    
        if (properties.lChannelMain) {
            ringLStartColor = rgb1StringTo255(properties.lChannelMain.value);
            worked = true;
        }
        
        if (properties.lChannelFade) {
            ringLEndColor = rgb1StringTo255(properties.lChannelFade.value);
        }
        
        if (properties.rChannelMain) {
            ringRStartColor = rgb1StringTo255(properties.rChannelMain.value);
        }

        if (properties.angleResolution) {
            resolution = properties.angleResolution.value;
        }

        if (properties.enableFpsMeter) {
            fpsMeter = properties.enableFpsMeter.value;
        }
        
        if (properties.rChannelFade) {
            ringREndColor = rgb1StringTo255(properties.rChannelFade.value);
        }
        
        if (properties.enableRipple) {
            rippleEnabled = properties.enableRipple.value; 
        }
        
        if (properties.bucketlife) {
            buckets = fillArray(0, properties.bucketlife.value)
        }
        
        if (properties.backgroundCenter) {
            backgroundColorCenter = rgb1StringTo255(properties.backgroundCenter.value);
            
            background.style.background = "radial-gradient(ellipse closest-side at center, " + colorToRgb(backgroundColorCenter) +  " 0%, " + colorToRgb(backgroundColorEdge) + " 100%)"
        }
        
        if (properties.customIcon) {
            customIconUrl = 'file:///' + properties.customIcon.value;
            setCustomIcon();
        }

        if (properties.customBackground) {
            backgroundImageUrl = 'file:///' + properties.customBackground.value;
            setBackgroundImage();
        }

        if (properties.backgroundBlendMode) {
            backgroundBlendMode = properties.backgroundBlendMode.value;
            setBackgroundImage();
        }

        if (properties.backgroundGradOpacity) {
            backgroundOpacity = properties.backgroundGradOpacity.value;
            setBackgroundImage();
        }

        if (properties.iconW) {
            customIconWidth = properties.iconW.value;
            setCustomIcon();
        }

        if (properties.iconH) {
            customIconHeight = properties.iconH.value;
            setCustomIcon();
        }
        
        if (properties.backgroundEdge) {
            backgroundColorEdge = rgb1StringTo255(properties.backgroundEdge.value);
            
            background.style.background = "radial-gradient(ellipse closest-side at center, " + colorToRgb(backgroundColorCenter) +  " 0%, " + colorToRgb(backgroundColorEdge) + " 100%)"
        }
        
        if (properties.usingSmallIcons) {
            if (properties.usingSmallIcons.value) {
                document.documentElement.style.padding = "16px 16px 30px 16px";
            } else {
                document.documentElement.style.padding = "16px 16px 40px 16px";
            }
        }
        
        if (properties.borderless) {
            if (properties.borderless.value === true) {
                document.getElementsByTagName("HTML")[0].style.padding = "0 0 0 0";
            } else if (properties.borderless.value === false) {
                document.getElementsByTagName("HTML")[0].style.padding = "16px 16px 40px 16px";
            }
        }
        
        if (properties.enableFlatUI) {
            enableFlat = properties.enableFlatUI.value;
        }

        last_static_frame_ts = 0;
    }
};

function setCustomIcon() {
    if (customIconUrl !== "file:///") {
        logo.childNodes.forEach(node => {
            if (node.style) {
                node.style.visibility = 'hidden'
            }
        })
        customIcon = new Image();
        customIcon.onload = function() {
            hasIconLoaded = true;
        }
        customIcon.src = customIconUrl;
    } else {
        logo.childNodes.forEach(node => {
            if (node.style) {
                node.style.visibility = 'visible';
            }
        })
        hasIconLoaded = false;
    }
}

function setBackgroundImage() {
    backgroundInvalidated = true;
    if (backgroundImageUrl !== "file:///") {
        backgroundImage = new Image();
        backgroundImage.onload = function() {
            hasBackgroundLoaded = true;
        }
        backgroundImage.src = backgroundImageUrl;
    } else {

        hasBackgroundLoaded = false;
    }
}

function getBlendMode(value) {
    switch (value) {
        case 1:
            return "normal";
        case 2:
            return "multiply";
        case 3:
            return "screen";
        case 4:
            return "overlay"
        case 5:
            return "darken"
        case 6:
            return "lighten"
        case 7:
            return "color-dodge"
        case 8:
            return "color-burn"
        case 9:
            return "hard-light"
        case 10:
            return "soft-light"
        case 11:
            return "difference"
        case 12:
            return "exclusion"
        case 13:
            return "hue"
        case 14:
            return "hard-light"
        case 15:
            return "saturation"
        case 16:
            return "color"
        case 17:
            return "luminosity"
    }
}

let last_audio_array = null;
function getLastAudioArray() {
    const result = last_audio_array;

    last_audio_array = null;

    return result;
}

function handleAudioArray(audioArray) {
    audioArray = multiplyArray(audioArray, sensitivity);
    retAudioArray = flip(audioArray);
    leftAudioSide = getSide(retAudioArray, 0);
    rightAudioSide = getSide(retAudioArray, 1);

    if (buckets.length === 0) {
        buckets = fillArray(0, 10)
    }

    let maxValue = 0;
    audioArray.forEach((value) => maxValue = Math.max(maxValue, value));

    let index = (Math.round(new Date() / max_bucket_age));
    let buckets_to_clear = index - previous_index;
    if (buckets_to_clear > buckets.length) {
        buckets_to_clear = buckets.length
    }

    if (buckets_to_clear > 0) {
        for (let i = 0; i < buckets_to_clear; ++i) {
            buckets[(previous_index+i+1) % buckets.length] = 0;
        }

        maxAudioValue = 0;
        for (let i = 0; i < buckets.length; ++i) {
            if (buckets[i] > maxAudioValue) {
                maxAudioValue = buckets[i];
            }
        }
    }

    previous_index = index;
    index = index % buckets.length;
    buckets[index] = Math.max(buckets[index], maxValue);
    if (maxValue > maxAudioValue) {
        maxAudioValue = maxValue;
    }
}

function wallpaperAudioListener(audioArray) {
    last_audio_array = audioArray;
}

let last_volume_state = false;

function drawStatic() {
    dotRingCtx.clearRect(0, 0, dotRingCanvas.width, dotRingCanvas.height);

    const radius = Math.min(dotRingCanvas.width, dotRingCanvas.height) / 2.6;
    const rings = 7;

    for (let i = 0; i < rings; i++) {
        drawDotRing(dotRingCtx, dotRingCanvas, radius * (1 - (0.1 * i)), dotRingColor);
    }

    if (last_volume_state) {
        drawDotRing(dotRingCtx, dotRingCanvas, radius * 1.1, colorToRgb(ringRStartColor, 0.8, 1),  1);
        drawDotRing(dotRingCtx, dotRingCanvas, radius * 1.13, colorToRgb(ringLStartColor, 0.8, 1), 1);
    }
}

function main_animation() {
    const lastAudioArray = getLastAudioArray();

    if (lastAudioArray !== null) {
        handleAudioArray(lastAudioArray);

        draw();
    }

    if (fpsMeter) {
        let now = performance.now();
        let fps = 1000.0 / (now - lastFrame);

        ctx.fillStyle = "#ffffff";
        
        ctx.fillText("fps: " + fps.toFixed(2), 10, 10);

        lastFrame = now;
    }

    requestAnimationFrame(main_animation);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas);
    drawIcon(ctx, canvas);
    const radius = Math.min(canvas.width, canvas.height) / 2.6;
    const rings = 7;

    if (direction === 3) {
        direction = 1;
        opacity = min;
    }

    if (!isSound) {
        globalOpacityOverride -= 0.1;
        logoOpacity += 0.05

        if (globalOpacityOverride < 0) {
            globalOpacityOverride = 0;
        }
        if (logoOpacity > 1) {
            logoOpacity = 1;
        }
    } else {
        globalOpacityOverride += 0.1;
        logoOpacity -= 0.3;

        if (globalOpacityOverride > 1) {
            globalOpacityOverride = 1;
        }

        if (logoOpacity < 0) {
            logoOpacity = 0;
        }
    }

    logo.style.opacity = logoOpacity;

    let volumes = null;

    if (retAudioArray && leftAudioSide && rightAudioSide) {
        volumes = getVolume(retAudioArray);

        if (volumes) {
            drawRipples(ctx, canvas, radius * 1.15, retAudioArray);

            drawResponsiveDotRing(ctx, canvas, radius * 1.115, volumeRingIdicator, volumes, 1);

            if (!enableFlat) {
                drawCenterGlow(ctx, canvas, volumes, 100);
                drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 1.5, ringRStartColor, leftAudioSide, volumes, true);
                drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 1.5, ringLStartColor, rightAudioSide, volumes, true, false);
            }

            for (let i = 0; i < preL.length; i++) {
                let opacity = (1 / preL.length) * (preL.length - (i + 1));

                drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 0.5, colorToRgb(ringREndColor, opacity), preL[i], volumes, false);
            }


            for (let i = 0; i < preR.length; i++) {
                let opacity = (1 / preR.length) * (preR.length - (i + 1));


                drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 0.5, colorToRgb(ringLEndColor, opacity), preR[i], volumes, false);
            }

            drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 1.5, colorToRgb(ringRStartColor), leftAudioSide, volumes, false);
            drawArcs(ctx, canvas, radius, (1 - (0.1 * (rings))) * radius, 1.5, colorToRgb(ringLStartColor), rightAudioSide, volumes, false);

            drawStereoBars(ctx, canvas, 150, [75 * volumes[0], 75 * volumes[1]]);
            drawTrackbar(ctx, canvas, 150, [75 * volumes[0], 75 * volumes[1]]);

            preL.unshift(leftAudioSide);
            preR.unshift(rightAudioSide);
            current = 0;

            if (preL.length > 5) {
                preL.pop();
                preR.pop();
            }
        }
    }

    const volume_state = volumes !== null;

    if (volume_state !== last_volume_state) {
        last_volume_state = volume_state;
        drawStatic();
    }

    drawPlayText(ctx, canvas);
}

function drawIcon(ctx, canvas) {
    if (hasIconLoaded) {
        if (logoOpacity > 0) {
            ctx.globalAlpha = opacity * logoOpacity;
            ctx.drawImage(customIcon, (canvas.width - customIconWidth) / 2, (canvas.height - customIconHeight) / 2, customIconWidth, customIconHeight);
            ctx.globalAlpha = 1;
        }
    }
}

function drawBackground(ctx, canvas) {
    if (hasBackgroundLoaded && backgroundInvalidated) {

        backgroundInvalidated = false;

        let width = backgroundImage.width;
        let height = backgroundImage.height;

        if (width < window.innerWidth) {
            height = height * (window.innerWidth / width);
            width = window.innerWidth;
        }

        if (height < window.innerHeight) {
            width = width * (window.innerHeight / height);
            height = window.innerHeight;
        }

        let radius = Math.sqrt(Math.pow(window.innerHeight, 2)) / 1.8;

        let gradient = bckCtx.createRadialGradient(window.innerWidth / 2, window.innerHeight / 2, 0, window.innerWidth / 2, window.innerHeight / 2, radius)

        gradient.addColorStop(0, colorToRgb(backgroundColorCenter, backgroundOpacity / 100, true))
        gradient.addColorStop(1, colorToRgb(backgroundColorEdge, backgroundOpacity / 100, true));

        bckCtx.drawImage(backgroundImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);

        bckCtx.globalCompositeOperation = getBlendMode(backgroundBlendMode);

        bckCtx.fillStyle = gradient;

        bckCtx.fillRect(0, 0, bckCanvas.width, bckCanvas.height);

        bckCtx.globalCompositeOperation = "normal";
    }
}

function drawCenterGlow(ctx, canvas, volumes, width) {
    const maxOpacity = 0.2;
    
    let volume = (volumes[0] + volumes[1]) / 2;
    
    let opacity = maxOpacity * volume;
    
    if (!opacity) { opacity = 1.0; }

    let x = canvas.width / 2;
    let y = canvas.height / 2;

    let glow = ctx.createRadialGradient(x, y, 0, x, y, width * 2)
    glow.addColorStop(0, "rgba(255,255,255," + (opacity * globalOpacityOverride) + ")");
    glow.addColorStop(1, "rgba(255,255,255,0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, width * 2, 0, TwoPi);
    ctx.closePath();
    ctx.fill();
}

function drawArcs(ctx, canvas, maxWidth, innerRing, thickness, color, audioRet, shadow = false, volumes) {
    let audio;
    if (smoother > 0) {
        audio = smooth(audioRet)
    } else {
        audio = audioRet
    }

    let angle = 100;

    const points = [];

    const audioStep = Math.ceil(audio.length / (resolution * 2));
    const angleIncrement = 344 / (audio.length) * audioStep;

    for (let i = 0; i < audio.length; i+=audioStep) {
        let point = calculateCurvePoint(canvas, maxWidth, innerRing, angle, audio[i], volumes);

        angle += angleIncrement;

        if(point in points) {
            continue;
        }

        points.push(point);
    }

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
        const point1 = points[i];

        if (points.hasOwnProperty(i + 1)) {
            //curve to the next point
            const point2 = points[i + 1];

            if (i === 0) {
                ctx.moveTo(point1.x, point1.y);
            } else {
                ctx.quadraticCurveTo(
                    point1.x,
                    point1.y,
                    (point1.x + point2.x) / 2,
                    (point1.y + point2.y) / 2
                );
            }
        }
    }

    if (shadow === true) {
        ctx.shadowBlur = 40;
        ctx.shadowColor = "rgba(0,0,0," + globalOpacityOverride + ")";
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness; 
    ctx.stroke();
    ctx.closePath();
}

function calculateCurvePoint(canvas, maxWidth, innerRing, angle,  audioValue) {
    const c = Math.min(audioValue / maxAudioValue, 1);
    const centX = canvas.width / 2;
    const centY = canvas.height / 2;
    const boost = 40;

    const range = maxWidth - innerRing;
    const radius = Math.min(innerRing + c * range + boost, maxWidth);
    const angleInRadians = -angle * HalfCirclePi;

    return {
        x: centX + radius * cosf(angleInRadians),
        y: centY + radius * sinf(angleInRadians),
    };
}

function drawPlayText() {
    let increment = 0.009;
    let max = 0.9;

    if (direction === 0) {
        opacity -= increment;
    } else if (direction === 1) {
        opacity += increment;
    } else {
        return;
    }
    
    if (opacity > max) {
        direction = 0;
        opacity = max;
    } else if (opacity < min) {
        direction = 1;
        opacity = min;
    }
}

function drawDotRing(ctx, canvas, radius, color, dotRadius = 0.5) {
    const numberOfDots = resolution;
    const centX = canvas.width / 2;
    const centY = canvas.height / 2;
    const angleIncrement = 340 / numberOfDots;
    const radianAngle = HalfCirclePi;
    let angle = 100;

    ctx.fillStyle = color;
    
    ctx.shadowColor = undefined;
    ctx.shadowBlur = undefined;

    ctx.beginPath();
    for (let i = 0; i < numberOfDots; i++) {
        const x = centX + radius * cosf(-angle * radianAngle);
        const y = centY + radius * sinf(-angle * radianAngle);

        ctx.fillRect(x-HALF_POINT_SIZE, y-HALF_POINT_SIZE, POINT_SIZE, POINT_SIZE);

        angle += angleIncrement;
    }
    ctx.closePath();
}

function drawRipples(ctx, canvas, radius, audio) {
    const maxDist = 30;
    let angle = 100;
    const centX = canvas.width / 2;
    const centY = canvas.height / 2;
    ctx.fillStyle = colorToRgb(hexToRgb(white), 0.7);

    if (!rippleEnabled) { return; }

    const angleIncrement = 340 / audio.length / 2;

    const angleRadian = HalfCirclePi;

    ctx.beginPath();
    for (let i = 0; i < resolution; i++) {
        drawRipple(audio[i], centX, centY, radius, maxDist, angle, angleRadian);

        angle += angleIncrement;

        if (audio.hasOwnProperty(i + 1)) {
            drawRipple((audio[i] + audio[i+1]) / 2, centX, centY, radius, maxDist, angle, angleRadian);

            angle += angleIncrement;
        } else {
            drawRipple(audio[i] / 2, centX, centY, radius, maxDist, angle, angleRadian);
        }
    }
    ctx.closePath();
}

function drawRipple(audioDotValue, centX, centY, radius, maxDist, angle, angleRadian) {
    const dist = maxDist * (audioDotValue / maxAudioValue);

    const x = centX + (radius + dist) * cosf(-angle * angleRadian);
    const y = centY + (radius + dist) * sinf(-angle * angleRadian);

    ctx.fillRect(x-HALF_POINT_SIZE, y-HALF_POINT_SIZE, POINT_SIZE, POINT_SIZE);
}

function drawResponsiveDotRing(ctx, canvas, radius, color, volumes) {
    const numberOfDots = resolution;

    const centX = canvas.width / 2;
    const centY = canvas.height / 2;

    let angle = 100;

    const angleIncrement = (340 / 2) / (numberOfDots / 2);
    const angleRadian = HalfCirclePi;

    const convColor = hexToRgb(color);

    for (let side = 0; side < 2; side++) {
        let sideVolume = (volumes[side] * resolution / 2);

        for (let i = 0; i < resolution / 2; i++) {
            let opacity;

            if (side === 0) {
                opacity = i > sideVolume ? 1 : 0.2
            } else {
                opacity = i < sideVolume ? 1 : 0.2
            }

            let x = centX + radius * cosf(-angle * angleRadian);
            let y = centY + radius * sinf(-angle * angleRadian);

            ctx.fillStyle = colorToRgb(convColor, opacity);

            ctx.fillRect(x-HALF_VOLUME_POINT_SIZE, y-HALF_VOLUME_POINT_SIZE, VOLUME_POINT_SIZE, VOLUME_POINT_SIZE);

            angle += angleIncrement;
        }
    }
}

function drawStereoBars(ctx, canvas, maxWidth, values) {
    const centX = canvas.width / 2;
    const centY = canvas.height / 2;
    const barHeight = 5;
    const tagWidth = 3;
    const margin = 4;

    ctx.shadowColor = 'rgba(0,0,0,' + (0.3 * globalOpacityOverride) +')';
    ctx.shadowBlur = 40;
    
    const shiftDown = -30;
    
    maxVolumeHeightL = Math.max(maxVolumeHeightL, values[0]);
    maxVolumeHeightR = Math.max(maxVolumeHeightR, values[1]);
    
    if (values[0] < 1) {
        maxVolumeHeightL = 0;
    }
    
    if (values[1] < 1) {
        maxVolumeHeightR = 0;
    }
    
    if (values[1] > 1 && values[0] > 1) {
        direction = 3;
        opacity = min;
    } 
    
    ctx.fillStyle = colorToRgb(hexToRgb(white));
    ctx.fillRect(centX - (maxWidth / 2) - (margin / 2), centY - (barHeight / 2) + shiftDown, tagWidth, barHeight);
    
    ctx.fillRect(centX + (maxWidth / 2) + (margin / 2), centY - (barHeight / 2) + shiftDown, tagWidth, barHeight);
    
    ctx.fillStyle = colorToRgb(ringLStartColor);
    ctx.fillRect(centX - (margin / 2) - values[0], centY - (barHeight / 2) + shiftDown, values[0], barHeight); 
    
    ctx.fillStyle = colorToRgb(ringRStartColor);
    ctx.fillRect(centX + (margin / 2), centY - (barHeight / 2) + shiftDown, values[1], barHeight);
    
    ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.shadowBlur = 0;
} 

function drawTrackbar(ctx, canvas, maxWidth, values) {
    let average = (values[0] + values[1]) / 2;
    const barWidth = 2;
    const barMargin = 4;
    const maxBars = maxWidth / (barWidth + barMargin);
    const shiftDown = 30;
    
    if (!volumes) {
        volumes = fillArray(0, maxBars);
    }

    volumes.unshift(average);
    if (volumes.length > maxBars) {
        volumes.pop();
    }

    ctx.fillStyle = colorToRgb(hexToRgb(white), globalOpacityOverride);
    let x = (canvas.width - maxWidth) / 2;
    
    for (let i = volumes.length - 1; i > -1; i--) {
        let y = (canvas.height - volumes[i]) / 2;
        ctx.fillRect(x, y + shiftDown, barWidth, volumes[i]);
        x += barWidth + barMargin;
    }
}

function getVolume(audioArray) {
    if (!audioArray) { return null; }
    
    let l = 0;
    for (let i = 0; i < 64; i++) {
        l += audioArray[i];
    }
    l = l / 64 * 15; 
    maxL = Math.max(maxL, l);

    let r = 0;
    for (let i = 64; i < 128; i++) {
        r += audioArray[i];
    }
    r = r / 64 * 15;
    maxR = Math.max(maxR, r);

    l = l / maxL;
    r = r / maxR;
    
    l = Math.min(1, l);
    r = Math.min(1, r);

    isSound = l > 0.01 && r > 0.01;

    return [l, r];
}

function fillArray(value, len) {
    return new Array(len).fill(value);
}

function flip(rightSide) {
    const half_length = Math.ceil(rightSide.length / 2);

    const leftSide = rightSide.splice(half_length, rightSide.length);

    rightSide.reverse();

    return leftSide.concat(rightSide);
}

function getSide(audio, number) {
    const half_length = Math.ceil(audio.length / 2);

    if (number === 0) {
        return audio.slice().splice(0, half_length);
    } else {
        return audio.slice().splice(half_length, audio.length);
    }
}

function colorToRgb(color, opacity = -1, forceOverride = false) {
    if (opacity === -1) {
        opacity = 0.8;
    }

    if (!forceOverride) {
        opacity = opacity * globalOpacityOverride;
    }

    return "rgba(" 
        + color[0] 
        + ", " 
        + color[1] 
        + ", " 
        + color[2] 
        + ", " 
        + (opacity)
        + ")";
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function rgb1StringTo255(colorText) {
    let values = colorText.split(" ");
    let ret = [0,0,0];
    ret[0] = Math.min(Math.ceil(values[0] * 255),255);
    ret[1] = Math.min(Math.ceil(values[1] * 255),255);
    ret[2] = Math.min(Math.ceil(values[2] * 255),255);
    return ret;
}

function multiplyArray(array, value) {
    return array.map(element => element * value);
}

function smooth(values) {
    const len = values.length;
    let ret = [];
    for (let i = 0; i < len; i++) {
        ret.push(values[i]);

        if (i < values.length - 1 && i > 0) {
            let pre = values[i]
            let next = values[i+1]
            ret.push(Math.max(0, (pre + next) / 2))
        }
    }
    return ret;
}
