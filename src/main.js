/*
	main.js is primarily responsible for hooking up the UI to the rest of the application 
	and setting up the main event loop
*/
import * as canvas from './canvas.js';
import * as audio from './audio.js';

// We will write the functions in this file in the traditional ES5 way
// In this instance, we feel the code is more readable if written this way
// If you want to re-write these as ES6 arrow functions, to be consistent with the other files, go ahead!

import * as utils from './utils.js';

const drawParams = {
    showGradient: true,
    showBars: true,
    showCircles: true,
    showNoise: false,
    showWaveform: true,
    invertColors: false,
    emboss: false,
    grayScale: false,
    threshold: false,
    frequencyLines: true,
    frequencyStyle: "default",
    showFrequencyGradient: true,
    gradientColorA: "#ff0000",
    gradientColorB: "#ff7f00",
    gradientColorC: "#ffff00",
    gradientColorD: "#00ff00",
    gradientColorE: "#0000ff",
    gradientColorF: "#2e2b5f",
    gradientColorG: "#8b00ff",
    globalStyle: 1,
};

// 1 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
    sound1: "media/Aragami.mp3"
});

function init() {
    console.log("init called");
    console.log(`Testing utils.getRandomColor() import: ${utils.getRandomColor()}`);
    window.addEventListener("resize", sizeChanged);
    audio.setupWebaudio(DEFAULTS.sound1);
    let canvasElement = document.querySelector("canvas"); // hookup <canvas> element
    setupUI(canvasElement);
    canvas.setupCanvas(canvasElement, audio.analyserNode);
    document.querySelector("#progress-background").onmousedown = audioTimeClicked;
    document.querySelector("#progress-foreground").onmousedown = audioTimeClicked;
    loop();
}

function setupUI(canvasElement) {
    //Setup the main canvas
    sizeChanged();

    // A - hookup fullscreen button
    const fsButton = document.querySelector("#fsButton");

    // add .onclick event to button
    fsButton.onclick = e => {
        console.log("init called");
        utils.goFullscreen(canvasElement);
    };

    const playButton = document.querySelector("#playButton");

    // add .onclick event to button
    playButton.onclick = e => {
        console.log(`audioCtx.state before = ${audio.audioCtx.state}`);

        //Check for suspended
        if (audio.audioCtx.state == "suspended") {
            audio.audioCtx.resume();
        }
        console.log(`audioCtx.state after = ${audio.audioCtx.state}`);

        //Swap between play and pause state
        if (e.target.dataset.playing == "no") {
            audio.playCurrentSound();
            e.target.dataset.playing = "yes";
        } else {
            audio.pauseCurrentSound();
            e.target.dataset.playing = "no";
        }
    };

    //hookup volume slider and label
    let volumeSlider = document.querySelector("#volumeSlider");
    let volumeLabel = document.querySelector("#volumeLabel");

    //add oninput event to slider
    volumeSlider.oninput = e => {
        //set gain
        audio.setVolume(e.target.value);
        //update page visuals to match
        volumeLabel.innerHTML = Math.round((e.target.value / 2 * 100));
    };

    //Set initial text from slider
    volumeSlider.dispatchEvent(new Event("input"));

    //hookup track select
    let trackSelect = document.querySelector("#trackSelect");
    //add onchange event
    trackSelect.onchange = e => {
        audio.loadSoundFile(e.target.value);
        //pause if playing
        if (playButton.dataset.playing == "yes") {
            playButton.dispatchEvent(new MouseEvent("click"));
        }
    };

    document.querySelector('#global-style').onchange = e => {
        drawParams.globalStyle = e.target.value;
    };

    document.querySelector('#gradientCB').onchange = e => {
        drawParams.showGradient = e.target.checked;
    };

    document.querySelector("#settings-image").addEventListener('click', _ => {
        toggleSettingsMenu();
        sizeChanged();
    });

    document.querySelector("#settings-image").onmouseover = e => {
        document.querySelector("#settings-image").src = "media/settings-icon.png"
    }
    document.querySelector("#settings-image").onmouseout = e => {
        document.querySelector("#settings-image").src = "media/settings-icon2.png"
    }
    
    document.querySelector('#show-waveform').onchange = e => {
        drawParams.showWaveform = e.target.checked;
    };

    document.querySelector('#barsCB').onchange = e => {
        drawParams.showBars = e.target.checked;
    };

    document.querySelector('#circlesCB').onchange = e => {
        drawParams.showCircles = e.target.checked;
    };

    document.querySelector('#noiseCB').onchange = e => {
        drawParams.showNoise = e.target.checked;
    };

    document.querySelector('#invertCB').onchange = e => {
        drawParams.invertColors = e.target.checked;
    };

    document.querySelector('#embossCB').onchange = e => {
        drawParams.emboss = e.target.checked;
    };

    document.querySelector('#grayscaleCB').onchange = e => {
        drawParams.grayScale = e.target.checked;
    };

    document.querySelector('#thresholdCB').onchange = e => {
        drawParams.threshold = e.target.checked;
    };

    document.querySelector('#frequency-line-check').onchange = e => {
        drawParams.frequencyLines = e.target.checked;
    };

    document.querySelector('#frequency-style').onchange = e => {
        drawParams.frequencyStyle = e.target.value;
    };

    document.querySelector('#frequencyGradientCB').onchange = e => {
        drawParams.showFrequencyGradient = e.target.checked;
    };

    document.querySelector('#color-a-picker').onchange = e => {
        drawParams.gradientColorA = e.target.value;
    };

    document.querySelector('#color-b-picker').onchange = e => {
        drawParams.gradientColorB = e.target.value;
    };

    document.querySelector('#color-c-picker').onchange = e => {
        drawParams.gradientColorC = e.target.value;
    };

    document.querySelector('#color-d-picker').onchange = e => {
        drawParams.gradientColorD = e.target.value;
    };

    document.querySelector('#color-e-picker').onchange = e => {
        drawParams.gradientColorE = e.target.value;
    };

    document.querySelector('#color-f-picker').onchange = e => {
        drawParams.gradientColorF = e.target.value;
    };

    document.querySelector('#color-g-picker').onchange = e => {
        drawParams.gradientColorG = e.target.value;
    };

    document.querySelector('#filter-select').onchange = e => {
        audio.setFilter(e.target.value);
    };

    document.querySelector('#convolver-select').onchange = e => {
        audio.setConvolverFile(e.target.value);
    };

    //hookup btd slider and label
    let bdtSlider = document.querySelector("#bdt-slider");
    let bdtLabel = document.querySelector("#bdt-label");

    //add oninput event to slider
    bdtSlider.oninput = e => {
        //set bdt
        canvas.setBeatDetectionThreshold(e.target.value);
        //update page visuals to match
        bdtLabel.innerHTML = e.target.value;
    };

    //Set initial text from slider
    bdtSlider.dispatchEvent(new Event("input"));
} // end setupUI

function loop() {
    requestAnimationFrame(loop);

    canvas.draw(drawParams);
    let audioElement = audio.getAudioElement();
    if (audioElement != null) {
        let percentage = (audioElement.currentTime / audioElement.duration);
        let maxWidth = document.querySelector("#progress-background").width;
        document.querySelector("#progress-foreground").width = percentage * maxWidth;
    }
}

function audioTimeClicked(e)
{
    audio.setAudioTime((e.offsetX / document.querySelector("#progress-background").width) * audio.getAudioElement().duration);
}

function sizeChanged() {
    let canvasElement = document.querySelector("canvas");
    let size = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
    let left = window.innerWidth > window.innerHeight ? (window.innerWidth - size) / 2 : 0;
    canvasElement.width = size;
    canvasElement.height = size;
    canvasElement.style.left = left > 0 ? `${left + 4}px` : `${4}px`;

    document.querySelector("#progress-background").width = size - 26;
    document.querySelector("#progress-background").style.left = left > 0 ? `${left + 17}px` : `${17}px`;
    document.querySelector("#progress-foreground").style.left = left > 0 ? `${left + 19}px` : `${17}px`;

    document.querySelector("#settings-image").style.left = `${size - 58 + left}px`;
    document.querySelector("#controls").style.left = `${size - document.querySelector("#controls").offsetWidth + left}px`;
    document.querySelector("#controls").style.maxHeight = `${window.innerHeight - 50}px`;

    canvas.updateCanvasVisuals(canvasElement);
}

function toggleSettingsMenu() {
    if (document.querySelector("#controls").style.display != "block") {
        document.querySelector("#controls").style.display = "block"
    } else {
        document.querySelector("#controls").style.display = "none"
    }
}

export {
    init
};
