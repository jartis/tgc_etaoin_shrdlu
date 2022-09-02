//#region Constants
const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1920;
const GAMESIZEY = 1080;

var Sentences = [

    'The Good Chemicals',
    'ETAOIN   SHRDLU',
    ' ',
    ' ',

    'Breathe.',
    'In and out.',
    'Inhale.',
    'Exhale.',

    'You are loved.',
    'You are enough.',
    'You are safe.',
    'You are smart.',

    'You are beautiful,',
    'and you are unique.',
    'You are a gift',
    'to this world.',

    'Breathe.',
    'In and out.',
    'Inhale.',
    'Exhale.',

    'Be proud of yourself.',
    'You have traveled',
    'so very far',
    'in this world.',

    'You truly deserve ',
    'to take the time',
    'to heal your body',
    'and soothe your soul.',

    'Breathe.',
    'In and out.',
    'Inhale.',
    'Exhale.',

    'You will face',
    'many challenges,',
    'but they will pass',
    'and you will overcome.',

    'The smallest things',
    'you do every day',
    'are the biggest things',
    'to the people you love.',

    'Breathe.',
    'In and out.',
    'Inhale.',
    'Exhale.',

    'Hey.',
    ' ',
    'I believe in you,',
    'and I love you.',

    ' ',
    ' ',
    ' ',
    ' ',
];

let midSentence = false;
var songDone = false;

const GlobalTransposeOffset = Math.floor(Math.random() * 12);

//#endregion


// Initialize the canvas
var srcCanvas = document.createElement('canvas');
srcCanvas.width = GAMESIZEX;
srcCanvas.height = GAMESIZEY;
var ctx = srcCanvas.getContext('2d'); // All game drawing takes place on this context
var dstCanvas = document.getElementById('canvas');
var dstctx = dstCanvas.getContext('2d'); // This is the target canvas that fills the window
var screenOffsetX = 0;
var screenOffsetY = 0;
var gameScale = 0;
var newGameWidth = 0;
var newGameHeight = 0;
var dscale = srcCanvas.width / srcCanvas.height;
var bgcolor = '#000000';
var screenOrientation = LANDSCAPE; // 0 Horiz, 1 Vert
var ModalUp = false;

var curFont = 'potralight';
var currentTextSpot = 0;
var voices;

//#region Game logic goes here

function InitGame() {
    ctx.font = '72px ' + curFont;
    currentTextSpot = calculateSentenceStart(Sentences[0]);
    // bgcolor = getRandomRgb(0, 64);

    window.speechSynthesis.onvoiceschanged = function() {
        voices = window.speechSynthesis.getVoices().filter(function(v) {
            return v.lang.startsWith('en');
        });
    };
}

function Update() {
    // Game logic here
}

function DrawGame() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    ctx.globalAlpha = 1;
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
        ctx.fillStyle = hexToRgba(keyToColorDict[currentKey], pulseOpacity);
        ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
        ctx.globalAlpha = 1;
    }
    // draw visualizer
    const freqData = analyser.getValue();

    let barWidth = (srcCanvas.width / 100) * 2.5;
    let barHeight;
    let x = 0;

    let hue = HexToHSV(keyToColorDict[currentKey]).h;
    ctx.fillStyle = 'hsla(' + hue + ', 100%, 50%, 0.1' + ')';
    hue += 3;
    hue %= 360;
    for (let i = 0; i < 100; i++) {
        barHeight = Math.pow(freqData[i], 2) * 6 / 256;
        ctx.fillStyle = 'hsla(' + hue + ', 100%, 50%, 0.1' + ')';
        ctx.fillRect(x, srcCanvas.height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
        hue += 3;
        hue %= 360;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Draw letter imprints
    imprints.forEach(imprint => {
        ctx.font = '72px ' + curFont;
        ctx.fillStyle = imprint.color;
        ctx.fillText(imprint.char, imprint.x, imprint.y);
        imprint.y += imprint.dy;
        imprint.dy *= 1.001;
    });

    for (let i = 0; i < imprints.length; i++) {
        if (imprints[i].y > 1130 || imprints[i].y < -50) {
            imprints.splice(i, 1);
        }
    }
}

//#endregion

//#region Initialization
//#endregion

//#region Handlers
function HandleMouse(e) {
    if (ModalUp) return; // Ignore the mouse if a Modal is currently displayed
    // mX and mY are Mouse X and Y in 'Source Screen' coordinates
    let mX = (e.offsetX - screenOffsetX) / gameScale;
    let mY = (e.offsetY - screenOffsetY) / gameScale;

    // Mouse handling here
}

function HandleKeys(e) {
    if (ModalUp) return; // Ignore the keyboard if a Modal is currently displayed

    // Key handling here
}
//#endregion

//#region Draw Utilities
function DrawScreen() {
    Update();

    // Clear the little canvas
    // ctx.globalAlpha = 0.02;
    // ctx.fillStyle = bgcolor;
    // ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    // ctx.globalAlpha = 1;

    // Draw the game elements
    DrawGame();

    // Blit to the big canvas
    //dstctx.fillStyle = bgcolor;
    //dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    window.requestAnimationFrame(DrawScreen);
}

function ResizeGame() {
    dstCanvas.width = window.innerWidth;
    dstCanvas.height = window.innerHeight;

    if (dstCanvas.width >= dstCanvas.height) {
        dscale = GAMESIZEX / GAMESIZEY;
        screenOrientation = LANDSCAPE;
        srcCanvas.width = GAMESIZEX;
        srcCanvas.height = GAMESIZEY;
        if (dstCanvas.width / dstCanvas.height > dscale) {
            newGameHeight = dstCanvas.height;
            newGameWidth = newGameHeight / GAMESIZEY * GAMESIZEX;
            gameScale = newGameHeight / GAMESIZEY;
        } else {
            newGameWidth = dstCanvas.width;
            newGameHeight = newGameWidth / GAMESIZEX * GAMESIZEY;
            gameScale = newGameWidth / GAMESIZEX;
        }
    } else {
        dscale = GAMESIZEY / GAMESIZEX;
        screenOrientation = PORTRAIT;
        srcCanvas.width = GAMESIZEY;
        srcCanvas.height = GAMESIZEX;
        if (dstCanvas.width / dstCanvas.height > dscale) {
            newGameHeight = dstCanvas.height;
            newGameWidth = newGameHeight / GAMESIZEX * GAMESIZEY;
            gameScale = newGameHeight / GAMESIZEX;
        } else {
            newGameWidth = dstCanvas.width;
            newGameHeight = newGameWidth / GAMESIZEY * GAMESIZEX;
            gameScale = newGameWidth / GAMESIZEY;
        }
    }

    screenOffsetX = Math.abs((dstCanvas.width - newGameWidth)) / 2;
    screenOffsetY = Math.abs((dstCanvas.height - newGameHeight)) / 2;
}
//#endregion

//#region General Utility
function Shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

function RandomRangedRgb(lo, hi) {
    var r = (lo + Math.round((hi - lo) * Math.random()));
    var g = (lo + Math.round((hi - lo) * Math.random()));
    var b = (lo + Math.round((hi - lo) * Math.random()));
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}

function QuadLerp(t, x1, x2, x3) {
    return ((((1 - t) * (1 - t)) * x1) + (2 * (1 - t) * t * x2) + ((t * t) * x3));
}
//#endregion

// overwrite getValue from tone analyser
class AnalyserByteData extends Tone.Analyser {
    getValue() {
        this._analysers.forEach((analyser, index) => {
            const buffer = this._buffers[index];
            if (this._type === 'fft') {
                analyser.getByteFrequencyData(buffer);
            } else if (this._type === 'waveform') {
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
    let synthType = 'sine';
    switch (Math.floor(Math.random() * 4)) {
        case 0:
            synthType = 'fatsine';
            break;
        case 1:
            synthType = 'fatsquare';
            break;
        case 2:
            synthType = 'fattriangle';
            break;
        case 3:
            synthType = 'fatsawtooth';
            break;
    }
    let partials = 1 + Math.floor(Math.random() * Math.random() * 32);
    return synthType + partials;
}

const imprints = [];

// animations
let isPulsingIn = false;
let isPulsingOut = false;
let pulseOpacity = 0;

const KEY_CHANGE_MODE = 'keyCount';
let changeKeyTimeout = null;
let silenceBackgroundTimeout = null;
let isBackgroundPlaying = false;
let keyPressesUpperBoundary = 20;
let keyPresses = 0;
let currentKey = 'C';
let transposition = 0;
const previousNote = {
    baseNote: null,
    octave: null,
};
var keyChangeCount = 0;

document.getElementById('start').addEventListener('click', (e) => {
    e.target.style.display = 'none';
    changeKey();
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    // Do initialization here
    ResizeGame();
    DrawScreen();
    InitGame();
    player = new Tone.Player('res/shrdlu_drums.wav').connect(analyser).toDestination();
    // play as soon as the buffer is loaded
    player.loop = true;
    player.volume.value = -6;
});

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
const delay = new Tone.PingPongDelay('4n', 0.2);
const reverb = new Tone.Reverb(6.5).toDestination();
const analyser = new AnalyserByteData('fft', 256);

//synth.connect(chorus);
chorus.connect(widener);
synth.connect(delay);
//delay.connect(reverb);
synth.connect(reverb);
bgSynth.connect(reverb);
bgSynth.connect(delay);
bgSynth.connect(analyser);
synth.connect(analyser);

const keyToColorDict = {
    'C': '#FF0000',
    'C#': '#FF7F00',
    'D': '#FFFF00',
    'D#': '#7FFF00',
    'E': '#00FF00',
    'F': '#00FF7F',
    'F#': '#00FFFF',
    'G': '#007FFF',
    'G#': '#0000FF',
    'A': '#7F00FF',
    'A#': '#FF00FF',
    'B': '#FF007F',
};

const keyToPitchDict = {
    'a': ['C'],
    'b': ['D'],
    'c': ['C', 'E'],
    'd': ['C', 'G'],
    'e': ['E', 'G'],
    'f': ['D', 'F'],
    'g': ['D', 'A'],
    'h': ['C', 'F'],
    'i': ['D', 'G'],
    'j': ['C', 'E', 'G'],
    'k': ['E', 'G', 'B'],
    'l': ['C', 'A', 'G'],
    'm': ['C', 'D', 'A'],
    'n': ['C'],
    'o': ['D'],
    'p': ['C', 'E'],
    'q': ['C', 'G'],
    'r': ['E', 'G'],
    's': ['D', 'F'],
    't': ['D', 'A'],
    'u': ['C', 'F'],
    'v': ['D', 'G'],
    'w': ['C', 'E', 'G'],
    'x': ['E', 'G', 'B'],
    'y': ['C', 'A', 'G'],
    'z': ['C', 'D', 'A'],
    ',': ['C'],
    '.': ['A'],
    '!': ['G'],
    '?': ['E'],
};

function changeKey() {
    if (songDone) return;
    keyChangeCount++;
    if (keyChangeCount % 16 == 0) {
        currentKey = 'C';
        transposition = 0;
    } else if (keyChangeCount % 4 != 0) {
        transposition += 7;
        const transposedNote = Tone.Frequency(`${currentKey}4`).transpose(7).toNote();
        const splitTransposedNote = transposedNote.split('');
        const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
            splitTransposedNote[1] :
            '';
        const transposedBaseNote = splitTransposedNote[0] + accidental;
        currentKey = transposedBaseNote;

        if ((keyChangeCount % 4 == 1) && (keyChangeCount > 16)) {
            startAffirmations();
        }
        if ((keyChangeCount % 4 == 1) && (keyChangeCount > 32)) {
            if (player.state == 'stopped') {
                curFont = 'Shadows Into Light';
                player.start();
            }
        }
    }
    triggerBackgroundChord();
    isPulsingIn = true;

    setTimeout(() => {
        changeKey();
    }, 4000);
};

function triggerBackgroundChord() {
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
    bgSynth.triggerAttackRelease(notes, "1:0");
    isBackgroundPlaying = true;
};

function startAffirmations() {
    if (!midSentence) {
        midSentence = true;

        setTimeout(() => {
            let msgText = Sentences[0];
            if (Sentences[0].startsWith('ETA')) {
                msgText = "Etta oin sured loo";
            }
            let msg = new SpeechSynthesisUtterance(msgText);
            msg.rate = 0.6;
            msg.volume = 0.9;
            // Get a random voice
            msg.voice = voices[Math.floor(Math.random() * voices.length)];
            window.speechSynthesis.speak(msg);
        }, 500);

        setTimeout(stepAffirmation, 500);
    }
}

function stepAffirmation() {
    if (Sentences.length > 0) {
        if (Sentences[0].length > 0) {
            let char = Sentences[0].substring(0, 1);
            Sentences[0] = Sentences[0].substring(1);

            handleLetter(char);
            setTimeout(stepAffirmation, 500);
        } else {
            Sentences.shift();
            midSentence = false;
            if (Sentences.length > 0) {
                currentTextSpot = calculateSentenceStart(Sentences[0]);
            } else {
                songDone = true;
            }
        }
    }
}

function calculateSentenceStart(sent) {
    // FIXME: Go by actual width of text
    let SWidth = ctx.measureText(sent).width;
    return (960 - (SWidth / 2));
}


function hexToRgba(hex, opacity) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return (
            'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') +
            `,${opacity})`
        );
    }
    throw new Error('Bad Hex');
}

function handleLetter(char) {
    const octaves = [4, 5];
    let octave = octaves[Math.floor(Math.random() * octaves.length)];
    let baseNotes = keyToPitchDict[char.toLowerCase()] || [];
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
                isPulsingIn = true;
                triggerBackgroundChord();
            }
            const transposedNote = Tone.Frequency(note).transpose(transposition + GlobalTransposeOffset).toNote();
            const splitTransposedNote = transposedNote.split('');
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                '';
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            i++;
            synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, '32n', '+0.' + (250 * i));
        });
    } else if (baseNotes.length == 1) {
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
            const splitTransposedNote = transposedNote.split('');
            const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
                splitTransposedNote[1] :
                '';
            const transposedBaseNote = splitTransposedNote[0] + accidental;
            synth.triggerAttackRelease(`${transposedBaseNote}${octave}`, '16n', '+0.250');
        });
    }

    const x = currentTextSpot;
    let dir = Math.sign(0.5 - (Math.floor((keyChangeCount - 1) / 4) % 2));
    let imprint = {
        char: char,
        color: keyChangeCount < 32 ? '#FFFFFF' : keyToColorDict[currentKey],
        x: x,
        y: (dir > 0) ? 0 : 1080,
        dy: dir,
    };
    currentTextSpot += ctx.measureText(char).width;
    imprints.push(imprint);
}

function HexToHSV(hex) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let v = max / 255.0;
    let d = max - min;
    s = (max === 0) ? 0 : d / max;
    if (max === min) {
        h = 0;
    } else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}