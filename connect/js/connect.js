const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1080;
const GAMESIZEY = 1080;

const rules = {
    A: "-BF+AF5A+FB-", // Rule 1
    B: "+AF-BF4B-FA+" // Rule 2
};

var notes = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

var tpose = [
    0, 5, 7, 12
];

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
var segColor = 0;
var curveObject = {};
var startX = 40;
var startY = 1040;
var fr = 0;
//#region Game logic goes here

var globalTranspose = Math.floor(Math.random() * 12);

// synths

function InitGame() {
    const now = Tone.now();
    Tone.Transport.start();
    // bgcolor = getRandomRgb(0, 64);
    notes = Shuffle(notes);
    tpose = Shuffle(tpose);
    setupCurves();
}

function Update() {
    // Game logic here
}

function DrawGame() {
    for (let cIdx = curveObjects.length - 1; cIdx >= 0; cIdx--) {
        let curveObject = curveObjects[cIdx];
        //if (curveObject.erase < 0) continue;
        if (fr % curveObject.trigger == 0) {
            let didDraw = false;
            while (!didDraw) {
                if (curveObject.inst.length == 0) {
                    didDraw = true;
                    continue;
                }
                let result = curveObject.inst.shift();
                let dx = incX(curveObject.angle, curveObject.inc);
                let dy = incY(curveObject.angle, curveObject.inc);
                // Game element drawing goes here
                if (result === "F") {
                    didDraw = true;
                    if (curveObject.erase % 2 == 0) {
                        ctx.strokeStyle = "#000000";
                    } else {
                        segColor++;
                        segColor %= 360;
                        ctx.strokeStyle = "hsl(" + segColor + ", 100%, 50%)";
                    }
                    ctx.lineWidth = curveObject.weight;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(curveObject.x, curveObject.y);
                    curveObject.x = dx + curveObject.x;
                    curveObject.y = dy + curveObject.y;
                    ctx.lineTo(curveObject.x, curveObject.y);
                    ctx.stroke();
                    if (curveObject.erase % 2 == 1) {
                        PlayNote(curveObject.synth, WTC[curveObject.step], curveObject.duration);
                        curveObject.step++;
                        curveObject.step %= WTC.length;
                    }
                } else if (result === "+") {
                    curveObject.angle -= Math.PI / 2;
                } else if (result === "-") {
                    curveObject.angle += Math.PI / 2;
                } else if (result === "5") {
                    curveObject.curNote = TransposeBase(curveObject.curNote, curveObject.curOctave, 7);
                } else if (result === "4") {
                    curveObject.curNote = TransposeBase(curveObject.curNote, curveObject.curOctave, -7);
                } else if (result === "R") {
                    curveObject.x = startX;
                    curveObject.y = startY;
                    curveObject.erase = 1 - curveObject.erase;
                    didDraw = true;
                }
                curveObject.inst.push(result);
            }
        }
    }
    fr++;
}


//#endregion

//#region Initialization
function startThings() {
    document.getElementById('start').style.display = 'none';
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    // Do initialization here
    InitGame();
    ResizeGame();
    window.setTimeout(DrawScreen, 1000);
};
//#endregion

//#region Handlers
function HandleMouse(e) {
    if (ModalUp) return; // Ignore the mouse if a Modal is currently displayed
    // mX and mY are Mouse X and Y in "Source Screen" coordinates
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
    // ctx.fillStyle = bgcolor;
    // ctx.globalAlpha = 0.018;
    // ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    // ctx.globalAlpha = 1;

    DrawGame();

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    //dstctx.rotate(-(Math.PI / 180));
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


// Hilbert helpers
function incX(angleRads, stepSize) {
    return Math.round(Math.cos(angleRads) * stepSize);
}

function incY(angleRads, stepSize) {
    return Math.round(Math.sin(angleRads) * stepSize) * -1;
}

function replaceAll(str, mapObj) {
    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");

    return str.replace(re, function(matched) {
        return mapObj[matched];
    });
}

var curveObjects = [];

function setupCurves(iterations = 6) {
    let result = "A";
    let notelen = 256;
    //let trigger = Math.pow(5, iterations);
    let trigger = 3 * iterations;
    // Production
    for (var j = 0; j < iterations; j++) {
        let nsynth = new Tone.PolySynth().toDestination();
        nsynth.set({
            portamento: 0.0,
            oscillator: {
                type: getRandomOsc(j + 1),
            },
            envelope: {
                attack: 0.001,
                decay: 0.1 * (iterations - j),
                sustain: 0.01 * (iterations - j),
                release: 0.01 * (iterations - j),
            },
        });
        nsynth.volume.value = -18 + (j * 2);
        result = replaceAll(result, rules);
        curveObject = {
            x: startX,
            y: startY,
            inc: Math.floor(1024 / (Math.pow(2, j + 1))),
            angle: 0,
            inst: result.split(""),
            curNote: notes[0],
            curOctave: (Math.ceil((j + 3) / 2)),
            synth: nsynth,
            duration: notelen,
            trigger: trigger,
            weight: iterations - j,
            erase: (j % 2),
            step: 0,
        };
        curveObject.inst.push("R");
        curveObjects.push(curveObject);

        notelen /= 2;
        // trigger /= 5;
        trigger -= 3;
    }
}

function getRandomOsc(iter) {
    let synthType = "sine";
    switch (iter % 4) {
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
    let partials = 1 + Math.ceil(Math.random() * Math.pow(1.4, iter));
    return synthType + partials;
}

function PlayNote(csynth, currentNote, dur) {
    const transposedNote = Tone.Frequency(`${currentNote}`).transpose(globalTranspose).toNote();
    csynth.triggerAttackRelease(`${transposedNote}`, dur + "n");
};

function TransposeBase(base, oct, dif) {
    const transposedNote = Tone.Frequency(`${base}${oct}4`).transpose(dif).toNote();
    const splitTransposedNote = transposedNote.split("");
    const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
        splitTransposedNote[1] :
        "";
    transposedBaseNote = splitTransposedNote[0] + accidental;
    return transposedBaseNote;
}

const WTC = ['c4',
    'e4',
    'g4',
    'c5',
    'e5',
    'g4',
    'c5',
    'e5',
    'c4',
    'e4',
    'g4',
    'c5',
    'e5',
    'g4',
    'c5',
    'e5',
    'c4',
    'd4',
    'a4',
    'd5',
    'f5',
    'a4',
    'd5',
    'f5',
    'c4',
    'd4',
    'a4',
    'd5',
    'f5',
    'a4',
    'd5',
    'f5',
    'b3',
    'd4',
    'g4',
    'd5',
    'f5',
    'g4',
    'd5',
    'f5',
    'b3',
    'd4',
    'g4',
    'd5',
    'f5',
    'g4',
    'd5',
    'f5',
    'c4',
    'e4',
    'g4',
    'c5',
    'e5',
    'g4',
    'c5',
    'e5',
    'c4',
    'e4',
    'g4',
    'c5',
    'e5',
    'g4',
    'c5',
    'e5',
    'c4',
    'e4',
    'a4',
    'e5',
    'a5',
    'a4',
    'e5',
    'a5',
    'c4',
    'e4',
    'a4',
    'e5',
    'a5',
    'a4',
    'e5',
    'a5',
    'c4',
    'd4',
    'F#4',
    'A4',
    'D5',
    'F#4',
    'A4',
    'D5',
    'c4',
    'd4',
    'F#4',
    'A4',
    'D5',
    'F#4',
    'A4',
    'D5',
    'b3',
    'd4',
    'g4',
    'd5',
    'g5',
    'g4',
    'd5',
    'g5',
    'b3',
    'd4',
    'g4',
    'd5',
    'g5',
    'g4',
    'd5',
    'g5',
    'b3',
    'c4',
    'e4',
    'g4',
    'c5',
    'e4',
    'g4',
    'c5',
    'b3',
    'c4',
    'e4',
    'g4',
    'c5',
    'e4',
    'g4',
    'c5',
    'a3',
    'c4',
    'e4',
    'g4',
    'c5',
    'e4',
    'g4',
    'c5',
    'a3',
    'c4',
    'e4',
    'g4',
    'c5',
    'e4',
    'g4',
    'c5',
    'd3',
    'a3',
    'd4',
    'f#4',
    'c5',
    'd4',
    'f#4',
    'c5',
    'd3',
    'a3',
    'd4',
    'f#4',
    'c5',
    'd4',
    'f#4',
    'c5',
    'g3',
    'b3',
    'd4',
    'g4',
    'b4',
    'd4',
    'g4',
    'b4',
    'g3',
    'b3',
    'd4',
    'g4',
    'b4',
    'd4',
    'g4',
    'b4',
    'g3',
    'a#3',
    'e4',
    'g4',
    'c#5',
    'e4',
    'g4',
    'c#5',
    'g3',
    'a#3',
    'e4',
    'g4',
    'c#5',
    'e4',
    'g4',
    'c#5',
    'f3',
    'a3',
    'd4',
    'a4',
    'd5',
    'd4',
    'a4',
    'd5',
    'f3',
    'a3',
    'd4',
    'a4',
    'd5',
    'd4',
    'a4',
    'd5',
    'f3',
    'g#3',
    'd4',
    'f4',
    'b4',
    'd4',
    'f4',
    'b4',
    'f3',
    'g#3',
    'd4',
    'f4',
    'b4',
    'd4',
    'f4',
    'b4',
    'e3',
    'g3',
    'c4',
    'g4',
    'c5',
    'c4',
    'g4',
    'c5',
    'e3',
    'g3',
    'c4',
    'g4',
    'c5',
    'c4',
    'g4',
    'c5',
    'e3',
    'f3',
    'a3',
    'c4',
    'f4',
    'a3',
    'c4',
    'f4',
    'e3',
    'f3',
    'a3',
    'c4',
    'f4',
    'a3',
    'c4',
    'f4',
    'd3',
    'f3',
    'a3',
    'c4',
    'f4',
    'a3',
    'c4',
    'f4',
    'd3',
    'f3',
    'a3',
    'c4',
    'f4',
    'a3',
    'c4',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'c3',
    'e3',
    'g3',
    'c4',
    'e4',
    'g3',
    'c4',
    'e4',
    'c3',
    'e3',
    'g3',
    'c4',
    'e4',
    'g3',
    'c4',
    'e4',
    'c3',
    'g3',
    'a#3',
    'c4',
    'e4',
    'a#3',
    'c4',
    'e4',
    'c3',
    'g3',
    'a#3',
    'c4',
    'e4',
    'a#3',
    'c4',
    'e4',
    'f2',
    'f3',
    'a3',
    'c4',
    'e4',
    'a3',
    'c4',
    'e4',
    'f2',
    'f3',
    'a3',
    'c4',
    'e4',
    'a3',
    'c4',
    'e4',
    'f#2',
    'c3',
    'a3',
    'c4',
    'd#4',
    'a3',
    'c4',
    'd#4',
    'f#2',
    'c3',
    'a3',
    'c4',
    'd#4',
    'a3',
    'c4',
    'd#4',
    'G#2',
    'f3',
    'b3',
    'c4',
    'd4',
    'b3',
    'c4',
    'd4',
    'G#2',
    'f3',
    'b3',
    'c4',
    'd4',
    'b3',
    'c4',
    'd4',
    'g2',
    'f3',
    'g3',
    'b3',
    'd4',
    'g3',
    'b3',
    'd4',
    'g2',
    'f3',
    'g3',
    'b3',
    'd4',
    'g3',
    'b3',
    'd4',
    'g2',
    'e3',
    'g3',
    'c4',
    'e4',
    'g3',
    'c4',
    'e4',
    'g2',
    'e3',
    'g3',
    'c4',
    'e4',
    'g3',
    'c4',
    'e4',
    'g2',
    'd3',
    'g3',
    'c4',
    'f4',
    'g3',
    'c4',
    'f4',
    'g2',
    'd3',
    'g3',
    'c4',
    'f4',
    'g3',
    'c4',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'g2',
    'd#3',
    'a3',
    'c4',
    'f#4',
    'a3',
    'c4',
    'f#4',
    'g2',
    'd#3',
    'a3',
    'c4',
    'f#4',
    'a3',
    'c4',
    'f#4',
    'g2',
    'e3',
    'g3',
    'c4',
    'g4',
    'g3',
    'c4',
    'g4',
    'g2',
    'e3',
    'g3',
    'c4',
    'g4',
    'g3',
    'c4',
    'g4',
    'g2',
    'd3',
    'g3',
    'c4',
    'f4',
    'g3',
    'c4',
    'f4',
    'g2',
    'd3',
    'g3',
    'c4',
    'f4',
    'g3',
    'c4',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'g2',
    'd3',
    'g3',
    'b3',
    'f4',
    'g3',
    'b3',
    'f4',
    'c2',
    'c3',
    'g3',
    'a#3',
    'e4',
    'g3',
    'a#3',
    'e4',
    'c2',
    'c3',
    'g3',
    'a#3',
    'e4',
    'g3',
    'a#3',
    'e4',
    'c2',
    'c3',
    'f3',
    'a3',
    'c4',
    'f4',
    'c4',
    'a3',
    'c4',
    'a3',
    'f3',
    'a3',
    'f3',
    'd3',
    'f3',
    'd3',
    'c2',
    'b2',
    'g4',
    'b4',
    'd5',
    'f5',
    'd5',
    'b4',
    'd5',
    'b4',
    'g4',
    'b4',
    'd4',
    'f4',
    'e4',
    'd4'
];