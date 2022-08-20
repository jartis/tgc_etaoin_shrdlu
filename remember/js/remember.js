var Sentences = [

    "The Good Chemicals",
    "E T A O I N  S H R D L U",
    " ",
    " ",

    "Breathe.",
    "In and out.",
    "Inhale.",
    "Exhale.",

    "You are loved.",
    "You are enough.",
    "You are safe.",
    "You are smart.",

    "You are beautiful,",
    "and you are unique.",
    "You are a gift",
    "to this world.",

    "Breathe.",
    "In and out.",
    "Inhale.",
    "Exhale.",

    "Be proud of yourself.",
    "You have traveled",
    "so very far",
    "in this world.",

    "You truly deserve ",
    "to take the time",
    "to heal your body",
    "and soothe your soul.",

    "Breathe.",
    "In and out.",
    "Inhale.",
    "Exhale.",

    "You will face",
    "many challenges,",
    "but they will pass",
    "and you will overcome.",

    "The smallest things",
    "you do every day",
    "are the biggest things",
    "to the people you love.",

    "Breathe.",
    "In and out.",
    "Inhale.",
    "Exhale.",

    "Hey.",
    " ",
    "I believe",
    "in you.",

    " ",
    " ",
    " ",
    " ",
];

var songDone = false;

const GlobalTransposeOffset = Math.floor(Math.random() * 12);

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

// === TOP LEVEL VARS ===
// matter js
let Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Body = Matter.Body;
let engine = Engine.create({ gravity: { x: 0, y: 0 } });
const imprints = [];

// animations
let isPulsingIn = false;
let isPulsingOut = false;
let pulseOpacity = 0;
const canvas = document.getElementById("canvas");

// tone js
// 'timeout' or 'keyCount'
const KEY_CHANGE_MODE = "keyCount";
let changeKeyTimeout = null;
let silenceBackgroundTimeout = null;
let isBackgroundPlaying = false;
let keyPressesUpperBoundary = 20;
let keyPresses = 0;
let currentKey = "C";
let transposition = 0;
const previousNote = {
    baseNote: null,
    octave: null,
};

// maps
const keyToColorDict = {
    C: "#FFC0CB",
    G: "#EB6662",
    D: "#F7B172",
    A: "#ffe375",
    E: "#F7D37E",
    B: "#82C881",
    "F#": "#81c896",
    "C#": "#1D8F94",
    "G#": "#33a4b5",
    "D#": "#203d85",
    "A#": "#632085",
    F: "#c42bcc",
};

const keyToPitchDict = {
    a: ["C"],
    b: ["D"],
    c: ["C", "E"],
    d: ["C", "G"],
    e: ["E", "G"],
    f: ["D", "F"],
    g: ["D", "A"],
    h: ["C", "F"],
    i: ["D", "G"],
    j: ["C", "E", "G"],
    k: ["E", "G", "B"],
    l: ["C", "A", "G"],
    m: ["C", "D", "A"],
    n: ["C"],
    o: ["D"],
    p: ["C", "E"],
    q: ["C", "G"],
    r: ["E", "G"],
    s: ["D", "F"],
    t: ["D", "A"],
    u: ["C", "F"],
    v: ["D", "G"],
    w: ["C", "E", "G"],
    x: ["E", "G", "B"],
    y: ["C", "A", "G"],
    z: ["C", "D", "A"],
    ",": ["C"],
    ".": ["A"],
    "!": ["G"],
    "?": ["E"],
};

var player;

// UI
let words = "";
let selectAll = false;
const textarea = document.querySelector("#sentence");
var currentTextSpot = (750 - (25 * (Sentences[0].length + 1)));
const container = document.querySelector(".container");
const button = document.getElementById("start");
button.addEventListener("click", () => {
    button.style.display = "none";
    changeKey();
    player = new Tone.Player("res/shrdlu_drums.wav").connect(analyser).toDestination();
    // play as soon as the buffer is loaded
    player.loop = true;
    player.volume.value = -6;
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
Tone.Transport.bpm.value = 120;

// synths
const synth = new Tone.PolySynth().toDestination();
synth.set({
    portamento: 0.0,
    oscillator: {
        type: getRandomOsc(),
    },
    envelope: {
        attack: 2,
        decay: 3,
        sustain: 0.6,
        release: 2,
    },
});
synth.volume.value = -1;

const bgSynth = new Tone.PolySynth();
bgSynth.set({
    portamento: 0.0,
    oscillator: {
        type: getRandomOsc(),
    },
    envelope: {
        attack: 2,
        decay: 3,
        sustain: 0.4,
        release: 9,
    },
});
bgSynth.volume.value = -18;

// effects and routing
const chorus = new Tone.Chorus(0.3, 1.5, 0.7).start();
const widener = new Tone.StereoWidener(1).toDestination();
const delay = new Tone.PingPongDelay("4n", 0.2);
const reverb = new Tone.Reverb(6.5).toDestination();
const analyser = new AnalyserByteData("fft", 256);

bgSynth.connect(chorus);
chorus.connect(widener);
synth.connect(delay);
delay.connect(reverb);
synth.connect(reverb);
bgSynth.connect(reverb);
bgSynth.connect(delay);
bgSynth.connect(analyser);
synth.connect(analyser);

const updateText = (e) => {
    if (e.key === "Backspace" && selectAll) {
        selectAll = false;
        words = "";
        return (container.innerText = words);
    }
    if (e.ctrlKey && e.key === "a") {
        return (selectAll = true);
    } else {
        selectAll = false;
        window.getSelection().removeAllRanges();
    }
    if (keyToPitchDict.hasOwnProperty(e.key.toLowerCase()) || e.key === " ") {
        words += e.key;
    } else if (e.key === "Enter") {
        words += "\n";
    } else if (e.key === "Backspace") {
        words = words.substring(0, words.length - 1);
    }
    container.innerText = words;
};

const triggerBackgroundChord = () => {
    if (songDone) return;
    bgSynth.releaseAll();
    const baseNote = `${currentKey}2`;
    const baseNoteFrequency = Tone.Frequency(baseNote);
    const notes = [
        baseNoteFrequency.transpose(GlobalTransposeOffset),
        baseNoteFrequency.transpose((7 + GlobalTransposeOffset)),
        baseNoteFrequency.transpose(12 + GlobalTransposeOffset),
        baseNoteFrequency.transpose(4 + GlobalTransposeOffset),
    ];
    bgSynth.triggerAttack(notes);
    isBackgroundPlaying = true;
};

const setSilenceBackgroundTimeout = () => {
    if (silenceBackgroundTimeout) {
        clearTimeout(silenceBackgroundTimeout);
    }
    silenceBackgroundTimeout = setTimeout(() => {
        bgSynth.releaseAll();
        isBackgroundPlaying = false;
    }, 3000);
};

var letterVelY = 0.01;

var keyChangeCount = 0;

const changeKey = () => {
    if (songDone) return;
    keyChangeCount++;
    if (keyChangeCount % 16 == 0) {
        currentKey = 'C';
        transposition = 0;
    } else if (keyChangeCount % 4 != 0) {
        transposition += 7;
        const transposedNote = Tone.Frequency(`${currentKey}4`).transpose(7).toNote();
        const splitTransposedNote = transposedNote.split("");
        const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
            splitTransposedNote[1] :
            "";
        const transposedBaseNote = splitTransposedNote[0] + accidental;
        currentKey = transposedBaseNote;

        if ((keyChangeCount % 4 == 1) && (keyChangeCount > 16)) {
            startAffirmations();
        }
        if ((keyChangeCount % 4 == 1) && (keyChangeCount > 32)) {
            if (player.state == "stopped") {
                player.start();
            }
        }
    }
    triggerBackgroundChord();
    const now = Tone.now();
    Tone.Transport.start();
    isPulsingIn = true;

    setTimeout(() => {
        changeKey();
    }, 4000);
};

function startAffirmations() {
    letterVelY = (Math.floor(keyChangeCount / 4) % 2 == 0) ? -0.01 : 0.01;
    if (!midSentence) {
        midSentence = true;
        setTimeout(stepAffirmation, 500);
    }
}

function stepAffirmation() {
    if (Sentences.length > 0) {
        if (Sentences[0].length > 0) {
            let char = Sentences[0].substring(0, 1);
            Sentences[0] = Sentences[0].substring(1);

            let e = new KeyboardEvent('keydown', { key: char });
            handleKey(e);
            setTimeout(stepAffirmation, 500);
        } else {
            Sentences.shift();
            midSentence = false;
            if (Sentences.length > 0) {
                currentTextSpot = (750 - (25 * (Sentences[0].length + 1)));
            } else {
                songDone = true;
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

function handleKey(e) {
    if (e.key === " ") {
        currentTextSpot += 40;
    }
    if (e.key === "Enter") {
        currentTextSpot = 100;
    }
    if (e.key === "`") {
        changeKey();
    }
    const key = e.key.toLowerCase();
    const octaves = [4, 5];
    let octave = octaves[Math.floor(Math.random() * octaves.length)];
    let baseNotes = keyToPitchDict[key];
    if (!baseNotes) return;
    if (baseNotes.length > 1 && Math.random() + 0.5) {
        let i = 0;
        baseNotes.forEach(baseNote => {
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
            const transposedNote = Tone.Frequency(note).transpose(transposition + GlobalTransposeOffset).toNote();
            const splitTransposedNote = transposedNote.split("");
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                "";
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            setTimeout(() => {
                synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, "32n");
            }, 250 * i++);
        });
    } else {
        baseNotes.forEach(baseNote => {
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
            const transposedNote = Tone.Frequency(note).transpose(transposition + GlobalTransposeOffset).toNote();
            const splitTransposedNote = transposedNote.split("");
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                "";
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, "16n");
        });
    }

    const dimensions = 40;
    currentTextSpot += dimensions;
    if (currentTextSpot >= window.innerWidth) {
        currentTextSpot = dimensions;
    }
    const x = currentTextSpot;
    let letter = Bodies.rectangle(x, 500, dimensions, dimensions, {
        frictionAir: 0,
        render: {
            fillStyle: "#FFFFFF",
            initialSpacing: getRandom(-5, -15),
            trailFade: getRandom(100, 300),
            elapsedTime: 0,
            text: {
                fillStyle: "#FFFFFF",
                content: e.key,
                size: dimensions,
                color: keyToColorDict[currentKey],
            },
        },
    });
    Body.applyForce(letter, { x: letter.position.x, y: letter.position.y }, { x: 0, y: letterVelY });
    letterVelY *= 1.1;

    World.add(engine.world, [letter]);
}

// matter js stuff
const drawTrail = ({
    context,
    color,
    content,
    trailLength,
    initialSpacing,
}) => {
    for (let i = 1; i <= trailLength; i++) {
        context.translate(0, i * initialSpacing);
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.fillStyle = hexToRgba(color, (1 / trailLength) * (trailLength - i));
        context.fillText(content, 0, 0);
    }
};

const addLetterImprint = ({ position, color, content, body, font }) => {
    imprints.push({ position, color, content, body, font, opacity: 0.4 });
};

const drawLetterImprints = (context) => {
    imprints.forEach((imprint, i) => {
        context.save();
        context.translate(imprint.position.x, imprint.position.y);
        const x = imprint.body.vertices[1].x - imprint.body.vertices[0].x;
        const y = imprint.body.vertices[1].y - imprint.body.vertices[0].y;
        const radian = Math.atan2(y, x);
        context.rotate(radian);
        context.textBaseline = "middle";
        context.textAlign = "center";
        context.font = imprint.font;
        context.fillStyle = hexToRgba("#000000", imprint.opacity / 2);
        context.fillText(imprint.content, 2, 2);
        context.fillStyle = hexToRgba(imprint.color, imprint.opacity);
        context.fillText(imprint.content, 0, 0);
        context.restore();
        imprint.opacity -= 0.004;
        if (imprint.opacity <= 0) {
            imprints.splice(i, 1);
        }
    });
};

// animations
let previousTime = 0;

function draw(time) {
    let bodies = Matter.Composite.allBodies(engine.world);
    let context = canvas.getContext("2d");

    window.requestAnimationFrame(draw);

    context.fillStyle = "#000000";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;
    if (Tone.Transport.seconds > 0) {
        if (isPulsingIn && isBackgroundPlaying) {
            pulseOpacity += 0.0025;
        } else if (isPulsingOut || !isBackgroundPlaying) {
            if (pulseOpacity > 0) {
                pulseOpacity -= 0.0025;
            }
        }

        if (pulseOpacity > 0.3) {
            isPulsingIn = false;
            isPulsingOut = true;
        } else if (pulseOpacity < 0) {
            isPulsingOut = false;
            isPulsingIn = true;
        }
        context.fillStyle = hexToRgba(keyToColorDict[currentKey], pulseOpacity);
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1;
    }
    // draw visualizer
    const freqData = analyser.getValue();

    let barWidth = (canvas.width / 100) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < 100; i++) {
        barHeight = Math.pow(freqData[i], 2) * 6 / 256;
        context.fillStyle = hexToRgba(keyToColorDict[currentKey], 0.1);
        context.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
    }

    context.lineTo(canvas.width, canvas.height / 2);
    context.stroke();

    // draw letters
    context.beginPath();

    let deltaTime = 0;
    if (time) {
        deltaTime = time - previousTime;
        previousTime = time;
    }

    for (let i = 0; i < bodies.length; i += 1) {
        let part = bodies[i];
        if (part.render.text) {
            let fontsize = 30;
            let fontfamily = part.render.text.family || "Shadows Into Light";
            let color = part.render.text.color || "#FF0000";
            if (keyChangeCount < 32) {
                fontfamily = "potralight";
                color = "#FFFFFF";
            }
            if (part.render.text.size) {
                fontsize = part.render.text.size;
            } else if (part.circleRadius) {
                fontsize = part.circleRadius / 2;
            }
            let content = "";
            // context.shadowBlur = 40;
            // context.shadowColor = color;
            if (typeof part.render.text === "string") {
                content = part.render.text;
            } else if (part.render.text.content) {
                content = part.render.text.content;
            }
            context.fillStyle = "white";
            context.save();
            // draw og letter
            context.translate(part.position.x, part.position.y);
            const x = bodies[i].vertices[1].x - bodies[i].vertices[0].x;
            const y = bodies[i].vertices[1].y - bodies[i].vertices[0].y;
            const radian = Math.atan2(y, x);
            context.rotate(radian);
            context.textBaseline = "middle";
            context.textAlign = "center";
            context.fillStyle = color;
            context.font = fontsize + "px " + fontfamily;
            context.fillText(content, 0, 0);
            // draw trail
            part.render.elapsedTime += deltaTime;
            if (part.render.elapsedTime >= part.render.trailFade) {
                addLetterImprint({
                    position: { x: part.position.x, y: part.position.y },
                    color,
                    content,
                    body: bodies[i],
                    font: fontsize + "px " + fontfamily,
                });
                part.render.elapsedTime = 0;
            }
            // drawTrail({ context, color, content, trailLength: 5, initialSpacing: -2 * (part.velocity.y * 4) })
            context.restore();
            const { min, max } = part.bounds;
            const height = max.y - min.y;

            if (part.position.y - height >= window.innerHeight) {
                World.remove(engine.world, part);
            }
        }
    }
    drawLetterImprints(context);
    Engine.update(engine, 1000 / 60);
}
draw();

// helper functions
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function hexToRgba(hex, opacity) {
    let c;
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