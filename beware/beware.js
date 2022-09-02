var KICK;
var HAT;
var SHK;

var Sentences = [
    "This place is a message, ",
    "and part of a system of messages. ",
    "Pay attention to it! ",
    " ",

    "Sending this message ",
    "was important to us. ",
    "We considered ourselves to be ",
    "a powerful culture. ",

    "This is not a place of honor. ",
    "No highly esteemed deed ",
    "is commemorated here. ",
    "Nothing valued is here. ",

    "What is here was dangerous ",
    "and repulsive to us. ",
    "This message is a warning ",
    "about danger. ",

    "The danger is in ",
    "a particular location. ",
    "It increases ",
    "towards a center. ",

    "The center of danger ",
    "is here, ",
    "of a particular size and shape ",
    "and below us. ",

    "The danger is still present, ",
    "in your time, ",
    "as it was in ours. ",
    " ",

    "The danger is to the body, ",
    " ",
    "and it can kill. ",
    " ",

    "The form of danger ",
    "is an emenation ",
    "of energy. ",
    " ",

    "The danger is unleashed only ",
    "if you substantially disturb ",
    "this place physically. ",
    " ",

    "This place ",
    "is best shunned ",
    "and left ",
    "uninhabited. ",

    " ",
    " ",
    " ",
    " ",

];

var messageLetters = [];

var letterVelY = 0.01;
var keyChangeCount = 0;

var rads = [];

var frame = 0;

// overwrite getValue from tone analyser
class AnalyserByteData extends Tone.Analyser {
    getValue() {
        this._analysers.forEach((analyser, index) => {
            const buffer = this._buffers[index];
            if (this._type === "fft") {
                analyser.getByteFrequencyData(buffer);
            } else if (this._type === "waveform") {
                analyser.getByteTimeDomainData(buffer);
            }
        });
        if (this.channels === 1) {
            return this._buffers[0];
        } else {
            return this._buffers;
        }
    }

    get size() {
        return this._analysers[0].frequencyBinCount;
    }

    set size(size) {
        this._analysers.forEach((analyser, index) => {
            analyser.fftSize = size * 2;
            this._buffers[index] = new Uint8Array(size);
        });
    }
}

// === TOP LEVEL VARS ===

// animations
let isPulsingIn = false;
let isPulsingOut = false;
let pulseOpacity = 0;
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

function getRandomKey() {
    switch (Math.floor(Math.random() * 7)) {
        case 0:
            return "C";
        case 1:
            return "D";
        case 2:
            return "E";
        case 3:
            return "F";
        case 4:
            return "G";
        case 5:
            return "A";
        case 6:
            return "B";
    }
}

// tone js
// 'timeout' or 'keyCount'
const KEY_CHANGE_MODE = "keyCount";
let changeKeyTimeout = null;
let silenceBackgroundTimeout = null;
let isBackgroundPlaying = false;
let keyPressesUpperBoundary = 20;
let keyPresses = 0;
let baseKey = getRandomKey();
let baseKeyB = getRandomKey();
let currentKey = baseKey;
let transposition = 0;
const previousNote = {
    baseNote: null,
    octave: null,
};

var curBGColor = RandomRangedRgb(50, 100);

// maps
const keyToColorDict = {
    // C: "#FFC0CB",
    // G: "#EB6662",
    // D: "#F7B172",
    // A: "#ffe375",
    // E: "#F7D37E",
    // B: "#82C881",
    // "F#": "#81c896",
    // "C#": "#1D8F94",
    // "G#": "#33a4b5",
    // "D#": "#203d85",
    // "A#": "#632085",
    // F: "#c42bcc",
    C: RandomRangedRgb(50, 100),
    G: RandomRangedRgb(50, 100),
    D: RandomRangedRgb(50, 100),
    A: RandomRangedRgb(50, 100),
    E: RandomRangedRgb(50, 100),
    B: RandomRangedRgb(50, 100),
    "F#": RandomRangedRgb(50, 100),
    "C#": RandomRangedRgb(50, 100),
    "G#": RandomRangedRgb(50, 100),
    "D#": RandomRangedRgb(50, 100),
    "A#": RandomRangedRgb(50, 100),
    F: RandomRangedRgb(50, 100),
};

const fgKeyToColorDict = {
    // G: "#FFC0CB",
    // "G#": "#EB6662",
    // A: "#F7B172",
    // "A#": "#ffe375",
    // B: "#F7D37E",
    // C: "#82C881",
    // "C#": "#81c896",
    // D: "#1D8F94",
    // "D#": "#33a4b5",
    // E: "#203d85",
    // F: "#632085",
    // "F#": "#c42bcc",
    G: RandomRangedRgb(100, 250),
    "G#": RandomRangedRgb(100, 250),
    A: RandomRangedRgb(100, 250),
    "A#": RandomRangedRgb(100, 250),
    B: RandomRangedRgb(100, 250),
    C: RandomRangedRgb(100, 250),
    "C#": RandomRangedRgb(100, 250),
    D: RandomRangedRgb(100, 250),
    "D#": RandomRangedRgb(100, 250),
    E: RandomRangedRgb(100, 250),
    F: RandomRangedRgb(100, 250),
    "F#": RandomRangedRgb(100, 250),
};

const keyToPitchDict = {
    a: 7,
    b: 3,
    c: 0,
    d: 7,
    e: 3,
    f: 0,
    g: 7,
    h: 3,
    i: 0,
    j: 7,
    k: 3,
    l: 0,
    m: 7,
    n: 3,
    o: 0,
    p: 7,
    q: 3,
    r: 0,
    s: 7,
    t: 3,
    u: 0,
    v: 7,
    w: 3,
    x: 0,
    y: 7,
    z: 3,
    ",": 0,
    ".": 7,
    "!": 3,
    "?": 0,
    "\"": 7,
    ";": 3,
    ":": 0,
};

var player;
const TEMPO = 200;

// UI
let words = "";
let selectAll = false;
const textarea = document.querySelector("#sentence");
var currentTextSpot = (950 - (25 * (Sentences[0].length + 1)));
const container = document.querySelector(".container");
const button = document.getElementById("start");
button.addEventListener("click", () => {
    button.style.display = "none";

    Tone.Transport.bpm.value = TEMPO;

    KICK = new Tone.MembraneSynth({ pitchDecay: 0.1 });
    KICK.volume.value = -19;
    var comp = new Tone.Compressor(-30, 12).toDestination();
    KICK.connect(comp);
    KICK.connect(reverb);

    HAT = new Tone.NoiseSynth();
    const filter = new Tone.Filter(8000, "highpass").toDestination();
    filter.connect(widener);
    HAT.connect(filter);
    HAT.volume.value = -10;

    changeKey();
    //player = new Tone.Player("./shrdlu_drums.wav").toDestination();
    // play as soon as the buffer is loaded
    //player.loop = true;
    //player.volume.value = -6;
});

// set canvas to correct size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.onload = resizeCanvas;

// === TONE JS ===
// globals

function getRandomOsc() {
    let synthType = "sine";
    switch (Math.floor(Math.random() * 4)) {
        case 0:
            synthType = "fatsine";
            break;
        case 1:
            synthType = "fatsquare";
            break;
        case 2:
            synthType = "fattriangle";
            break;
        case 3:
            synthType = "fatsawtooth";
            break;
    }
    let partials = 1 + Math.floor(Math.random() * Math.random() * 32);
    return synthType + partials;
}

// synths
const synth = new Tone.PolySynth().toDestination();
synth.set({
    portamento: 0.0,
    oscillator: {
        type: getRandomOsc(),
    },
    envelope: {
        attack: 0.001,
        decay: 0.001,
        sustain: 0.5,
        release: 0.001,
    },
});
synth.volume.value = -18;

const bgSynth = new Tone.PolySynth();
bgSynth.set({
    portamento: 0.0,
    oscillator: {
        type: getRandomOsc(),
    },
    envelope: {
        attack: 0,
        decay: 3,
        sustain: 0.1,
        release: 1,
    },
});
bgSynth.volume.value = -14;

// effects and routing
const chorus = new Tone.Chorus(0.5, 1.2, 0.5).start();
const widener = new Tone.StereoWidener(1).toDestination();
const delay = new Tone.PingPongDelay("8n.", 0.2);
const reverb = new Tone.Reverb(6.5).toDestination();
const analyser = new AnalyserByteData("fft", 256);

bgSynth.connect(chorus);
chorus.connect(widener);
synth.connect(chorus);
delay.connect(reverb);
synth.connect(reverb);
bgSynth.connect(reverb);
bgSynth.connect(delay);
synth.connect(analyser);

const triggerBackgroundChord = () => {
    bgSynth.releaseAll();
    const baseNote = `${currentKey}2`;
    const baseNoteFrequency = Tone.Frequency(baseNote);
    let notes = [
        baseNote,
    ];
    if (keyChangeCount < 180) {
        if (keyChangeCount < 90) {
            notes.push(baseNoteFrequency.transpose(9));
            notes.push(baseNoteFrequency.transpose(16));
        } else {
            notes.push(baseNoteFrequency.transpose(7));
        }
    }
    bgSynth.triggerAttack(notes);
    isBackgroundPlaying = true;
};

function getTPose() {
    return 4; //  + (Math.floor((keyChangeCount - 1) / 32) % 2 == 1 ? 5 : 0);
}

const changeKey = () => {
    keyChangeCount++;
    if (keyChangeCount > 0) {
        if (keyChangeCount > 8) {
            KICK.triggerAttackRelease("c1", "32n");
            HAT.triggerAttackRelease("32n", "+0:1");
            HAT.triggerAttackRelease("32n", "+0:2");
            HAT.triggerAttackRelease("32n", "+0:3");
            HAT.triggerAttackRelease("32n", "+1:0");
            KICK.triggerAttackRelease("c1", "32n", "+1:1");
            HAT.triggerAttackRelease("32n", "+1:2");
            if (Math.random() > 0.5) {
                HAT.triggerAttackRelease("64n", "+1:3:0");
                HAT.triggerAttackRelease("64n", "+1:3:1");
                HAT.triggerAttackRelease("64n", "+1:3:2");
            } else {
                KICK.triggerAttackRelease("c1", "64n", "+1:3:0");
                KICK.triggerAttackRelease("c1", "64n", "+1:3:1");
                KICK.triggerAttackRelease("c1", "64n", "+1:3:2");
            }
        }
        if (keyChangeCount % 4 == 0) {
            currentKey = baseKey;
            transposition = 0;
        } else if (keyChangeCount % 4 != 0) {
            curBGColor = RandomRangedRgb(50, 100);
            transposition += getTPose();
            const transposedNote = Tone.Frequency(`${currentKey}4`).transpose(getTPose()).toNote();
            const splitTransposedNote = transposedNote.split("");
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                "";
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            currentKey = transposedBaseNote;

            if ((keyChangeCount % 4 == 1) && (keyChangeCount > 8)) {
                startPhrases();
            }
            if ((keyChangeCount % 4 == 1) && (keyChangeCount > 16)) {
                //if (player.state == "stopped") {
                //player.start();
                //}
            }
        }
    }
    if (keyChangeCount % 4 != 0) {
        triggerBackgroundChord();
        const now = Tone.now();
        Tone.Transport.start();
        isPulsingIn = true;
    }

    setTimeout(() => {
        changeKey();
    }, 2400);
};

function startPhrases() {
    letterVelY = (Math.floor(keyChangeCount / 4) % 2 == 0) ? -0.01 : 0.01;
    if (!midSentence) {
        midSentence = true;
        stepPhrase();
    }
}

function stepPhrase() {
    if (Sentences.length > 0) {
        if (Sentences[0].length > 0) {
            let char = Sentences[0].substring(0, 1);
            Sentences[0] = Sentences[0].substring(1);

            let e = new KeyboardEvent('keydown', { key: char });
            handleKey(e);
            setTimeout(stepPhrase, 300);
        } else {
            Sentences.push(Sentences.shift());
            midSentence = false;
            if (Sentences.length > 0) {
                currentTextSpot = (950 - (25 * (Sentences[0].length + 1)));
            }
        }
    }
}

let midSentence = false;

const handleIncrementKeyPress = () => {
    if (keyPresses > keyPressesUpperBoundary) {
        keyPresses = 0;
        keyPressesUpperBoundary = getRandom(8, 30);
    }
};

var travDist = 0;

function handleKey(e) {
    if (e.key === " ") {
        currentTextSpot += 40;
    }
    if (e.key === "Enter") {
        currentTextSpot = 200;
    }
    if (e.key === "`") {
        changeKey();
    }

    messageLetters.push({ x: 1920, dx: 4, letter: e.key });
    travDist = 0;
    lastWidth = context.measureText(e.key).width;

    const key = e.key.toLowerCase();
    const octaves = [4, 5];
    let octave = octaves[Math.floor(Math.random() * octaves.length)];
    let baseNote = currentKey;
    if (!baseNote) return;
    if (octave === previousNote.octave) {
        const filteredOctaves = octaves.filter(
            (octaveOption) => octaveOption !== octave
        );
        octave =
            filteredOctaves[Math.floor(Math.random() * filteredOctaves.length)];
    }
    previousNote.octave = octave;
    previousNote.baseNote = baseNote;
    const note = `${baseNote}${octave}`;
    const now = Tone.now();
    if (!isBackgroundPlaying) {
        Tone.Transport.start();
        isPulsingIn = true;
        triggerBackgroundChord();
    }
    const transposedNote = Tone.Frequency(note).transpose(transposition).toNote();
    const splitTransposedNote = transposedNote.split("");
    const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
        splitTransposedNote[1] :
        "";
    const transposedBaseNote = splitTransposedNote[0] + accidental;

    let longNote = true;
    if (Math.random() > 0.5) {
        longNote = false;
        if (Math.random() > 0.5) {
            if (Math.random() > 0.33) {
                const transposedNote = Tone.Frequency(note).transpose(transposition + 7).toNote();
                const splitTransposedNote = transposedNote.split("");
                const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                    splitTransposedNote[1] :
                    "";
                const transposedBaseNote = splitTransposedNote[0] + accidental;
                synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, "32n");
            }
            setTimeout(() => {
                let len = 32;
                if (longNote && Math.random() > 0.33) { len = 16; }
                synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, len + "n");
            }, 150);
        }

    } else {
        setTimeout(() => {
            const transposedNote = Tone.Frequency(note).transpose(transposition + 7).toNote();
            const splitTransposedNote = transposedNote.split("");
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                "";
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, "32n");
        }, 150);

        if (Math.random() > 0.33) {
            let len = 32;
            if (longNote && Math.random() > 0.33) { len = 16; }
            synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, len + "n");
        }
    }
}


// animations
let previousTime = 0;
let lastWidth = 0;

function draw() {
    frame++;
    window.requestAnimationFrame(draw);

    context.globalAlpha = 0.01;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
    if (Tone.Transport.seconds > 0) {
        if (isPulsingIn && isBackgroundPlaying) {
            pulseOpacity += 0.05;
        } else if (isPulsingOut || !isBackgroundPlaying) {
            if (pulseOpacity > 0) {
                pulseOpacity -= 0.025;
            }
        }

        if (pulseOpacity > 0.75) {
            isPulsingIn = false;
            isPulsingOut = true;
        } else if (pulseOpacity < 0) {
            isPulsingOut = false;
            //isPulsingIn = true;
        }
        context.fillStyle = hexToRgba(curBGColor, pulseOpacity);
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
    }
    // draw visualizer
    const freqData = analyser.getValue();

    let barWidth = (canvas.width / 100) * 2.5;
    let barHeight;
    let x = 0;

    context.fillStyle = hexToRgba(fgKeyToColorDict[currentKey], 0.1);

    context.beginPath();
    context.moveTo(0, 0);
    for (let i = 0; i < 100; i++) {
        barHeight = freqData[i] * 6;
        context.lineTo(x + (barWidth / 2), barHeight / 3);
        context.lineTo(x + barWidth, 0);
        //context.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
    }
    context.closePath();
    context.fill();
    context.stroke();

    x = canvas.width;
    context.beginPath();
    context.moveTo(canvas.width, canvas.height);
    context.lineWidth = 0;
    for (let i = 0; i < 100; i++) {
        barHeight = freqData[i] * 6;
        context.lineTo(x - (barWidth / 2), canvas.height - (barHeight / 3));
        context.lineTo(x - barWidth, canvas.height);
        //context.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
        x -= barWidth + 1;
    }
    context.closePath();
    context.fill();
    context.stroke();

    context.font = '60px Kdam Thmor Pro';
    if (messageLetters.length > 0) {
        travDist += 2;
    }
    let letterCount = 0;
    messageLetters.forEach((letr) => {
        letterCount++;
        let offset = (10 * Math.sin((letterCount + frame) * 0.05));
        context.fillStyle = '#000000';
        context.fillText(letr.letter,
            letr.x + letr.dx, 510 + offset);
        context.fillStyle = '#FF0000';
        context.fillText(letr.letter,
            letr.x, 510 + offset);
        letr.x -=
            letr.dx;
        letr.dx *= 0.9985;
    });
    while (messageLetters.length > 0 && messageLetters[0].x < -100) {
        messageLetters.shift();
    }
}
draw();

// helper functions
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function hexToRgba(hex, opacity) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split("");
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = "0x" + c.join("");
        return (
            "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
            `,${opacity})`
        );
    }
    throw new Error("Bad Hex");
}

function RandomRangedRgb(lo = 0, hi = 255) {
    var r = (lo + Math.round((hi - lo) * Math.random()));
    var g = (lo + Math.round((hi - lo) * Math.random()));
    var b = (lo + Math.round((hi - lo) * Math.random()));
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}