/*
	The purpose of this file is to take in the analyser node and a <canvas> element: 
	  - the module will create a drawing context that points at the <canvas> 
	  - it will store the reference to the analyser node
	  - in draw(), it will loop through the data in the analyser node
	  - and then draw something representative on the canvas
	  - maybe a better name for this file/module would be *visualizer.js* ?
*/

import * as utils from './utils.js';

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

let ctx, canvasWidth, canvasHeight, gradient, analyserNode, audioData, audioDataWaveform;

let lineDrawQueue = [];
let frameCount = 0;
let averageAmp = 0;

let prevFrameMilli = 0;
let frameTime = 0;
let appTime = 0;
let beatCheckTimer = 0;
let beatDetectionThreshold = 200;

function setupCanvas(canvasElement, analyserNodeRef) {
    // create drawing context
    updateCanvasVisuals(canvasElement);
    // keep a reference to the analyser node
    analyserNode = analyserNodeRef;
    // this is the array where the analyser data will be stored
    audioData = new Uint8Array(analyserNode.fftSize / 2);
    audioDataWaveform = new Uint8Array(analyserNode.frequencyBinCount);

    let d = new Date();
    prevFrameMilli = d.getMilliseconds();
}

function updateCanvasVisuals(canvasElement) {
    ctx = canvasElement.getContext("2d");
    canvasWidth = canvasElement.width;
    canvasHeight = canvasElement.height;
    // create a gradient that runs top to bottom
    gradient = utils.getLinearGradient(ctx, 0, 0, 0, canvasHeight, [{
        percent: 0,
        color: "#faf5e3"
    }, {
        percent: .25,
        color: "#daf2ef"
    }, {
        percent: .5,
        color: "#67e6d6"
    }, {
        percent: .75,
        color: "#3ab4c7"
    }, {
        percent: 1,
        color: "#21658f"
    }]);
}

function draw(params = {}) {
    // 1 - populate the audioData array with the frequency data from the analyserNode
    // notice these arrays are passed "by reference" 
    analyserNode.getByteFrequencyData(audioData);
    // OR
    analyserNode.getByteTimeDomainData(audioDataWaveform); // waveform data

    // 2 - draw background
    ctx.save();
    ctx.fillStyle = "black";
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.restore();

    // 3 - draw gradient
    if (params.showGradient) {
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 1.0;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }

    if (params.globalStyle == 1) {
        // 4 - draw bars
        drawFrequencyBars(params);

        // 5 - draw circles
        drawFrequencyCircle(params);
    } else if (params.globalStyle == 2) {
        // 5 - draw circles
        drawFrequencyCircle(params);

        // 4 - draw bars
        drawFrequencyBarsTypeTwo(params);
    }

    if (params.showWaveform) {
        drawWaveform();
    }

    // 6 - bitmap manipulation
    bitmapManipulation(params);

}

function drawWaveform() {
    let barSpacing = 0;
    let margin = 5;
    let screenWidthForBars = canvasWidth - ((audioDataWaveform.length - 12) * barSpacing) - margin * 2;
    let barWidth = screenWidthForBars / (audioDataWaveform.length - 12);
    let barHeight = 100;
    let topSpacing = 100;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, barHeight * (255.0 / audioDataWaveform[0]));
    for (let i = 1; i < audioDataWaveform.length - 1; i++) {
        ctx.lineTo(i * barWidth, barHeight * (255.0 / audioDataWaveform[i]));
    }
    ctx.strokeStyle = `rgba(0,0,0,1)`;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
}

function drawFrequencyBars(params = {}) {
    if (params.showBars) {
        let barSpacing = 0;
        let margin = 5;
        let screenWidthForBars = canvasWidth - ((audioData.length - 4) * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / (audioData.length - 4);
        let barHeight = 200;
        let topSpacing = 100;

        ctx.save();
        ctx.translate(canvasWidth, 0);
        ctx.rotate(90 * Math.PI / 180);

        for (let i = 0; i < audioData.length - 3; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.25 + (i / audioData.length)})`;
            ctx.fillRect(i * barWidth, 0, barWidth + 2, (barHeight * (255.0 / audioData[i]) * 0.5).clamp(barHeight * (255.0 / audioData[i]) * 0.5, (canvasWidth / 2) + 1));
        }
        ctx.restore();

        ctx.save();
        ctx.translate(0, canvasWidth);
        ctx.rotate(270 * Math.PI / 180);

        for (let i = 0; i < audioData.length - 3; i++) {
            ctx.fillStyle = `rgba(255,255,255,${0.25 + (i / audioData.length)})`;
            ctx.fillRect(((audioData.length - 4) - i) * barWidth, 0, barWidth + 2, (barHeight * (255.0 / audioData[i]) * 0.5).clamp(barHeight * (255.0 / audioData[i]) * 0.5, (canvasWidth / 2)));
        }
        ctx.restore();
    }
}

function drawFrequencyBarsTypeTwo(params = {}) {
    if (params.showBars) {
        let barSpacing = 0;
        let margin = 5;
        let screenWidthForBars = canvasWidth - ((audioData.length - 9) * barSpacing) - margin * 2;
        let barWidth = screenWidthForBars / (audioData.length - 9);
        let barHeight = 200;
        let topSpacing = 100;

        ctx.save();
        ctx.translate(canvasWidth, 0);
        ctx.rotate(90 * Math.PI / 180);

        for (let i = 0; i < audioData.length - 8; i++) {
            ctx.fillStyle = `rgba(0,25,50,${0.25 + (i / audioData.length)})`;
            ctx.fillRect(i * barWidth, 0, barWidth + 2, (barHeight * (255.0 / audioData[i]) * 0.135).clamp(barHeight * (255.0 / audioData[i]) * 0.135, (canvasWidth / 8) + 1));
        }
        ctx.restore();

        ctx.save();
        ctx.translate(0, canvasWidth);
        ctx.rotate(270 * Math.PI / 180);

        for (let i = 0; i < audioData.length - 8; i++) {
            ctx.fillStyle = `rgba(0,25,50,${0.25 + (i / audioData.length)})`;
            ctx.fillRect(((audioData.length - 9) - i) * barWidth, 0, barWidth + 2, (barHeight * (255.0 / audioData[i]) * 0.135).clamp(barHeight * (255.0 / audioData[i]) * 0.135, (canvasWidth / 8)));
        }
        ctx.restore();
    }
}

function drawFrequencyCircle(params = {}) {
    if (params.showCircles) {

        let maxRadius = canvasHeight / 2 > canvasWidth / 2 ? canvasWidth / 2 : canvasHeight / 2;
        let numValues = audioData.length - 12;

        let d = new Date();

        frameTime = d.getMilliseconds() - prevFrameMilli;
        if (frameTime < 0) {
            frameTime = frameTime + 1000;
        }
        appTime += frameTime;
        beatCheckTimer += frameTime;
        prevFrameMilli = d.getMilliseconds();

        let averageAmpF = 0;
        for (let i = 0; i < audioData.length; i++) {
            averageAmpF += audioData[i];
        }
        let pushNewLine = false;
        if (averageAmpF > averageAmp + beatDetectionThreshold && beatCheckTimer > 200) {
            pushNewLine = true;
            beatCheckTimer = 0;
            frameCount = 0;
        }
        averageAmp = (averageAmp + averageAmpF + averageAmpF + averageAmpF) / 4;


        let average = 0;
        for (let i = 0; i < numValues; i++) {
            average += audioData[i];
        }

        average /= numValues;

        ctx.save();
        ctx.translate(canvasWidth / 2, canvasHeight / 1.75);
        ctx.rotate(-90 * Math.PI / 180);

        if (params.globalStyle == 2) {
            if (params.frequencyLines) {
                frameCount++;
                linePulse(params.globalStyle);
            }
        }

        if (params.frequencyStyle == "default") {
            drawFrequencyLineDefault(maxRadius, numValues, pushNewLine);
        } else if (params.frequencyStyle == "average") {
            drawFrequencyLineAvereged(maxRadius, numValues, average, pushNewLine);
        } else if (params.frequencyStyle == "smooth") {
            drawFrequencyLineSmooth(maxRadius, numValues, pushNewLine);
        }

        ctx.fillStyle = "white";

        if (params.showFrequencyGradient) {
            let change = (d.getMilliseconds() % 1000) / 1000;

            let valueA = (0 + change);
            let valueB = ((1.0 / 7.0) + change) > 1 ? ((1.0 / 7.0) + change) - 1 : ((1.0 / 7.0) + change);
            let valueC = ((2.0 / 7.0) + change) > 1 ? ((2.0 / 7.0) + change) - 1 : ((2.0 / 7.0) + change);
            let valueD = ((3.0 / 7.0) + change) > 1 ? ((3.0 / 7.0) + change) - 1 : ((3.0 / 7.0) + change);
            let valueE = ((4.0 / 7.0) + change) > 1 ? ((4.0 / 7.0) + change) - 1 : ((4.0 / 7.0) + change);
            let valueF = ((5.0 / 7.0) + change) > 1 ? ((5.0 / 7.0) + change) - 1 : ((5.0 / 7.0) + change);
            let valueG = ((6.0 / 7.0) + change) > 1 ? ((6.0 / 7.0) + change) - 1 : ((6.0 / 7.0) + change);

            let gradientRainbow = utils.getRadialGradient(ctx, 0, 0, 0, 0, 0, maxRadius, [{
                percent: valueA,
                color: params.gradientColorA
                }, {
                percent: valueB,
                color: params.gradientColorB
                }, {
                percent: valueC,
                color: params.gradientColorC
                }, {
                percent: valueD,
                color: params.gradientColorD
                }, {
                percent: valueE,
                color: params.gradientColorE
                }, {
                percent: valueF,
                color: params.gradientColorF
                }, {
                percent: valueG,
                color: params.gradientColorG
    }]);
            ctx.fillStyle = gradientRainbow;
        }

        ctx.fill();
        ctx.closePath();

        if (params.globalStyle == 1) {
            if (params.frequencyLines) {
                frameCount++;
                linePulse(params.globalStyle);
            }
        }

        ctx.restore();
    }
}

function linePulse(style) {
    for (let i = 0; i < lineDrawQueue.length; i++) {
        lineDrawQueue[i].lifeTime += 3.0;
        ctx.beginPath();
        let vectorLength = Math.sqrt(lineDrawQueue[i].lineArray[0].x * lineDrawQueue[i].lineArray[0].x + lineDrawQueue[i].lineArray[0].y * lineDrawQueue[i].lineArray[0].y);
        let proportionValueX = (lineDrawQueue[i].lineArray[0].x / vectorLength) + Math.random() / 65;
        let proportionValueY = (lineDrawQueue[i].lineArray[0].y / vectorLength) + Math.random() / 65;

        ctx.moveTo(lineDrawQueue[i].lineArray[0].x + (lineDrawQueue[i].lifeTime * proportionValueX), lineDrawQueue[i].lineArray[0].y + (lineDrawQueue[i].lifeTime * proportionValueY));
        for (let j = 0; j < lineDrawQueue[i].lineArray.length; j++) {

            vectorLength = Math.sqrt(lineDrawQueue[i].lineArray[j].x * lineDrawQueue[i].lineArray[j].x + lineDrawQueue[i].lineArray[j].y * lineDrawQueue[i].lineArray[j].y);
            proportionValueX = (lineDrawQueue[i].lineArray[j].x / vectorLength) + Math.random() / 65;
            proportionValueY = (lineDrawQueue[i].lineArray[j].y / vectorLength) + Math.random() / 65;

            ctx.lineTo(lineDrawQueue[i].lineArray[j].x + (lineDrawQueue[i].lifeTime * proportionValueX), lineDrawQueue[i].lineArray[j].y + (lineDrawQueue[i].lifeTime * proportionValueY));
        }
        ctx.lineWidth = lineDrawQueue[i].lifeTime / 100;
        ctx.strokeStyle = "black";
        ctx.stroke();
        if (style == 2) {
            ctx.fillStyle = "white";
            ctx.globalAlpha = 1 / (lineDrawQueue[i].lifeTime / 200);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        if (lineDrawQueue[i].lifeTime > 900) {
            lineDrawQueue.shift();
        }
    }
}

function drawFrequencyLineDefault(maxRadius, numValues, pushNewLine) {
    ctx.beginPath();

    let lineArrayQueueElement = [];

    let startPercent = audioData[0] / 255;
    let startRadius = startPercent * maxRadius;
    startRadius = startRadius.clamp(20, 20000);
    let startPointY = startRadius * (Math.sin((Math.PI * 2)));
    let startPointX = startRadius * (Math.cos((Math.PI * 2)));

    ctx.moveTo(startPointX, startPointY);
    lineArrayQueueElement.push({
        "x": startPointX,
        "y": startPointY
    });

    for (let i = 1; i < numValues; i++) {
        startPercent = audioData[i] / 255;
        startRadius = startPercent * maxRadius;
        startRadius = startRadius.clamp(20, 20000);
        startPointY = startRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = startRadius * (Math.cos((Math.PI) / (numValues / i)));

        ctx.lineTo(startPointX, startPointY);
        lineArrayQueueElement.push({
            "x": startPointX,
            "y": startPointY
        });
    }

    for (let i = numValues - 1; i > 0; i--) {
        startPercent = audioData[i] / 255;
        startRadius = startPercent * maxRadius;
        startRadius = startRadius.clamp(20, 20000);
        startPointY = startRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = startRadius * (Math.cos((Math.PI) / (numValues / i)));

        ctx.lineTo(startPointX, -startPointY);
        lineArrayQueueElement.push({
            "x": startPointX,
            "y": -startPointY
        });
    }

    startPercent = audioData[0] / 255;
    startRadius = startPercent * maxRadius;
    startRadius = startRadius.clamp(20, 20000);
    startPointY = startRadius * (Math.sin((Math.PI * 2)));
    startPointX = startRadius * (Math.cos((Math.PI * 2)));

    ctx.lineTo(startPointX, startPointY);
    lineArrayQueueElement.push({
        "x": startPointX,
        "y": startPointY
    });

    if (pushNewLine) {
        lineDrawQueue.push({
            "lineArray": lineArrayQueueElement,
            "lifeTime": 1
        });
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.stroke();
}

function drawFrequencyLineSmooth(maxRadius, numValues, pushNewLine) {
    ctx.beginPath();

    let lineArrayQueueElement = [];

    let startPercent = audioData[1] / 255;
    let startRadius = startPercent * maxRadius;
    startRadius = startRadius.clamp(20, 20000);
    let startPointY = startRadius * (Math.sin((Math.PI * 2)));
    let startPointX = startRadius * (Math.cos((Math.PI * 2)));

    let usedRadius = startRadius;
    let prevRadius = startRadius;

    for (let i = 1; i < numValues; i++) {
        startPercent = audioData[i] / 255;
        startRadius = startPercent * maxRadius;
        usedRadius = (startRadius + prevRadius + prevRadius) / 3;
        usedRadius = usedRadius.clamp(20, 20000);
        startPointY = usedRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = usedRadius * (Math.cos((Math.PI) / (numValues / i)));

        prevRadius = usedRadius;
    }

    let realvaluesX = [];
    let realvaluesY = [];

    for (let i = numValues - 1; i > 0; i--) {
        startPercent = audioData[i] / 255;
        startRadius = startPercent * maxRadius;
        usedRadius = (startRadius + prevRadius + prevRadius) / 3;
        usedRadius = usedRadius.clamp(20, 20000);
        startPointY = usedRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = usedRadius * (Math.cos((Math.PI) / (numValues / i)));

        realvaluesX[Math.abs(1 - i)] = startPointX;
        realvaluesY[Math.abs(1 - i)] = -startPointY;

        prevRadius = usedRadius;
    }

    startPercent = audioData[0] / 255;
    startRadius = startPercent * maxRadius;
    startRadius = prevRadius.clamp(20, 20000);
    startPointY = startRadius * (Math.sin((Math.PI * 2)));
    startPointX = startRadius * (Math.cos((Math.PI * 2)));

    ctx.moveTo(realvaluesX[0], realvaluesY[0]);
    lineArrayQueueElement.push({
        "x": realvaluesX[0],
        "y": realvaluesY[0]
    });

    for (let i = 1; i < realvaluesX.length; i++) {
        ctx.lineTo(realvaluesX[i], realvaluesY[i]);
        lineArrayQueueElement.push({
            "x": realvaluesX[i],
            "y": realvaluesY[i]
        });
    }

    for (let i = realvaluesX.length - 1; i > 0; i--) {
        ctx.lineTo(realvaluesX[i], -realvaluesY[i]);
        lineArrayQueueElement.push({
            "x": realvaluesX[i],
            "y": -realvaluesY[i]
        });
    }

    ctx.lineTo(realvaluesX[0], -realvaluesY[0]);
    lineArrayQueueElement.push({
        "x": realvaluesX[0],
        "y": -realvaluesY[0]
    });

    ctx.lineTo(realvaluesX[0], realvaluesY[0]);
    lineArrayQueueElement.push({
        "x": realvaluesX[0],
        "y": realvaluesY[0]
    });

    if (pushNewLine) {
        lineDrawQueue.push({
            "lineArray": lineArrayQueueElement,
            "lifeTime": 1
        });
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.stroke();
}

function drawFrequencyLineAvereged(maxRadius, numValues, average, pushNewLine) {
    ctx.beginPath();

    let lineArrayQueueElement = [];

    average /= maxRadius;

    let startPercent = audioData[0] / 255;
    let startRadius = Math.pow(Math.abs(startPercent - average) * maxRadius, 0.85) * 3.1;
    startRadius = startRadius.clamp(20, canvasWidth / 2);
    let startPointY = startRadius * (Math.sin((Math.PI * 2)));
    let startPointX = startRadius * (Math.cos((Math.PI * 2)));

    ctx.moveTo(startPointX, startPointY);
    lineArrayQueueElement.push({
        "x": startPointX,
        "y": startPointY
    });

    for (let i = 1; i < numValues; i++) {
        startPercent = audioData[i] / 255;
        startRadius = Math.pow(Math.abs(startPercent - average) * maxRadius, 0.85) * 3.1;
        startRadius = startRadius.clamp(20, canvasWidth / 2);
        startPointY = startRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = startRadius * (Math.cos((Math.PI) / (numValues / i)));

        ctx.lineTo(startPointX, startPointY);
        lineArrayQueueElement.push({
            "x": startPointX,
            "y": startPointY
        });
    }

    for (let i = numValues - 1; i > 0; i--) {
        startPercent = audioData[i] / 255;
        startRadius = Math.pow(Math.abs(startPercent - average) * maxRadius, 0.85) * 3.1;
        startRadius = startRadius.clamp(20, canvasWidth / 2);
        startPointY = startRadius * (Math.sin((Math.PI) / (numValues / i)));
        startPointX = startRadius * (Math.cos((Math.PI) / (numValues / i)));

        ctx.lineTo(startPointX, -startPointY);
        lineArrayQueueElement.push({
            "x": startPointX,
            "y": -startPointY
        });
    }

    startPercent = audioData[0] / 255;
    startRadius = Math.pow(Math.abs(startPercent - average) * maxRadius, 0.85) * 3.1;
    startRadius = startRadius.clamp(20, canvasWidth / 2);
    startPointY = startRadius * (Math.sin((Math.PI * 2)));
    startPointX = startRadius * (Math.cos((Math.PI * 2)));

    ctx.lineTo(startPointX, startPointY);
    lineArrayQueueElement.push({
        "x": startPointX,
        "y": startPointY
    });

    if (pushNewLine) {
        lineDrawQueue.push({
            "lineArray": lineArrayQueueElement,
            "lifeTime": 1
        });
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = "black";
    ctx.stroke();
}

function bitmapManipulation(params = {}) {
    // A) grab all of the pixels on the canvas and put them in the `data` array
    // `imageData.data` is a `Uint8ClampedArray()` typed array that has 1.28 million elements!
    // the variable `data` below is a reference to that array 

    let imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    let data = imageData.data;
    let length = data.length;
    let width = imageData.width;

    // B) Iterate through each pixel, stepping 4 elements at a time (which is the RGBA for 1 pixel)
    for (let i = 0; i < length; i += 4) {
        // C) randomly change every 20th pixel to red
        if (params.showNoise && Math.random() < 0.25) {
            data[i] = data[i + 1] = data[i + 2] = 0;
            data[i] = 252;
            data[i + 1] = 245;
            data[i + 2] = 220;
        } // end if

        if (params.invertColors) {
            let red = data[i],
                green = data[i + 1],
                blue = data[i + 2];
            data[i] = 255 - red;
            data[i + 1] = 255 - green;
            data[i + 2] = 255 - blue;
        }

        if (params.grayScale) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            let v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            data[i] = data[i + 1] = data[i + 2] = v
        }
        if (params.threshold) {
            let threshold = 125;
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            let v = (0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold) ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v
        }


    } // end for

    if (params.emboss) {
        for (let i = 0; i < length; i++) {
            if (i % 4 == 3) continue;
            data[i] = 127 + 2 * data[i] - data[i + 4] - data[i + width * 4]
        }
    }

    // D) copy image data back to canvas
    ctx.putImageData(imageData, 0, 0);
}

function setBeatDetectionThreshold(value) {
    beatDetectionThreshold = Number(value);
}

export {
    setupCanvas,
    updateCanvasVisuals,
    setBeatDetectionThreshold,
    draw
};
