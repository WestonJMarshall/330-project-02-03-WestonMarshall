// 1 - our WebAudio context, **we will export and make this public at the bottom of the file**
let audioCtx;

// **These are "private" properties - these will NOT be visible outside of this module (i.e. file)**
// 2 - WebAudio nodes that are part of our WebAudio audio routing graph
let element, sourceNode, analyserNode, gainNode, filterNode, convolverNode;

let convolverFile;

// 3 - here we are faking an enumeration
const DEFAULTS = Object.freeze({
    gain: .5,
    numSamples: 256
});

// 4 - create a new array of 8-bit integers (0-255)
// this is a typed array to hold the audio frequency data
let audioData = new Uint8Array(DEFAULTS.numSamples / 2);
// **Next are "public" methods - we are going to export all of these at the bottom of this file**
async function setupWebaudio(filePath) {
    convolverFile = "media/A1.mp3";

    // 1 - The || is because WebAudio has not been standardized across browsers yet
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // 2 - this creates an <audio> element
    element = new Audio();

    // 3 - have it point at a sound file
    loadSoundFile(filePath);

    // 4 - create an a source node that points at the <audio> element
    sourceNode = audioCtx.createMediaElementSource(element);

    // 5 - create an analyser node
    // note the UK spelling of "Analyser"
    analyserNode = audioCtx.createAnalyser();

    // fft stands for Fast Fourier Transform
    analyserNode.fftSize = DEFAULTS.numSamples;

    // 7 - create a gain (volume) node
    gainNode = audioCtx.createGain();
    gainNode.gain.value = DEFAULTS.gain;

    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = "allpass";

    convolverNode = await createReverb();

    // 8 - connect the nodes - we now have an audio graph
    sourceNode.connect(convolverNode);
    convolverNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);
}

async function createReverb() {
    let convolver = audioCtx.createConvolver();

    // load impulse response from file
    let response     = await fetch(convolverFile);
    let arraybuffer  = await response.arrayBuffer();
    convolver.buffer = await audioCtx.decodeAudioData(arraybuffer);

    return convolver;
}

function loadSoundFile(filePath) {
    element.src = filePath;
}

function playCurrentSound() {
    element.play();
}

function pauseCurrentSound() {
    element.pause();
}

function setVolume(value) {
    value = Number(value);
    gainNode.gain.value = value;
}

async function setConvolverFile(value) {
    convolverFile = value;
    convolverNode = await createReverb();
    sourceNode.disconnect();
    sourceNode.connect(convolverNode);
    convolverNode.disconnect();
    convolverNode.connect(filterNode);
}

function setFilter(value) {
    filterNode.type = value;
}

export {
    audioCtx,
    setupWebaudio,
    playCurrentSound,
    pauseCurrentSound,
    loadSoundFile,
    setVolume,
    setFilter,
    setConvolverFile,
    analyserNode
};


// make sure that it's a Number rather than a String
