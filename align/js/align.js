const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1920;
const GAMESIZEY = 1080;
const TOP = 0;
const BOTTOM = 1;

const BASENOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

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
var maxPolys = 3;

//#region Game logic goes here

var polys = [];
var gPhase = 0;
var rings = [];
const transposeVals = [0, 2, -3, 4, -5, 7, -8, 9, -10, 12, -12];
const colors = [
    '#800000',
    '#008000',
    '#000080',
]
var rootNote = 'C';

function InitGame() {
    rootNote = BASENOTES[Math.floor(Math.random() * BASENOTES.length)];
    let pWidth = 920 / (maxPolys - 1);
    // bgcolor = getRandomRgb(0, 64);
    for (let i = 0; i < maxPolys; i++) {
        let angle = 0;
        let sides = Math.random() < 0.66 ? 3 : 5;
        let p = {
            x: 500 + (i * pWidth),
            sides: sides,
            angle: angle + (90 * (Math.floor(i / 2))),
            lastAngle: angle + (90 * (Math.floor(i / 2))),
            active: true,
            interior: ((i + 1) * 180) / (3 + i),
            whichline: (i % 2) ? BOTTOM : TOP,
            synth: getRandomSynth(i),
            curNote: 0,
            col: RandomRangedRgb(0, 33),
            opacity: 1,
        }
        polys.push(p);
    }
}

function Update() {
    // Game logic here
}

function drawSineWave(y, amplitude, frequency, phase) {
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let i = 0; i < 1920; i++) {
        ctx.lineTo(i, y + amplitude * Math.sin(frequency * i + phase));
    }
    ctx.lineTo(1920, y);
    ctx.stroke();
}

function DrawGame() {
    // count the active polygons
    let activePolys = 0;
    for (let i = 0; i < polys.length; i++) {
        if (polys[i].active) {
            activePolys++;
        }
    }

    // Draw the "Strings"
    drawSineWave(38, 3, 0.1, -gPhase);
    drawSineWave(1042, 3, 0.1, gPhase);
    gPhase += (0.1 * activePolys);

    // Draw the polygons
    for (let i = 0; i < polys.length; i++) {
        let p = polys[i];
        p.opacity = (Math.sin(gPhase / (100 * (i + 2))) / 2) + 0.5;
        DrawPolygon(p.x, p.sides, p.angle, p.active, p.col, p.opacity);
        if (p.angle > 360) { p.angle -= 360; }

        if (p.sides == 3) {
            if ((p.angle - 30) % 60 == 0) {
                let r = {
                    x: p.x,
                    y: 1042,
                    size: 5,
                    decay: 4,
                    o: 1,
                };
                if ((p.angle - 30) % 120 == 0) {
                    r.y = 38;
                }
                rings.push(r);
                PlayNote(p.synth, rootNote, 4, transposeVals[p.curNote], 0.5, p.opacity);
                p.curNote++;
                p.curNote %= 10;
            }

        } else {
            if ((p.angle - 90) % 36 == 0) {
                let r = {
                    x: p.x,
                    y: 38,
                    size: 3,
                    decay: 5,
                    o: 1,
                };
                if ((p.angle - 90) % 72 == 0) {
                    r.y = 1042;
                }
                rings.push(r);
                PlayNote(p.synth, rootNote, 3, transposeVals[p.curNote], 0.75, p.opacity / 2);
                p.curNote++;
                p.curNote %= 10;
            }
        }

        p.lastAngle = p.angle;

        p.angle += (1 / (Math.pow(2, i)));
    }

    // Draw the rings
    for (let i = 0; i < rings.length; i++) {
        let r = rings[i];
        r.size += (r.decay * r.decay);
        r.o -= (1 / (r.decay * r.decay));
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + r.o + ')';
        ctx.lineWidth = r.decay;
        ctx.arc(r.x, r.y, r.size, 0, 2 * Math.PI);
        ctx.stroke();
        if (r.o < 0) {
            rings.splice(i, 1);
            i--;
        }
    }
}


//#endregion

//#region Initialization
function Start() {
    document.getElementById('start').style.display = 'none';
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    // Do initialization here
    InitGame();
    ResizeGame();
    DrawScreen();
};

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

    // If a number is pressed, change the active state of that polygon
    if (e.keyCode >= 49 && e.keyCode <= 57) {
        let p = polys[e.keyCode - 49];
        p.active = !p.active;
    }

    // Key handling here
}
//#endregion

//#region Draw Utilities
function DrawScreen() {
    Update();

    // Clear the little canvas
    ctx.fillStyle = bgcolor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    ctx.globalAlpha = 1;

    // Draw the game elements
    DrawGame();

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
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

// Draw a regular polygon with n sides, a radius r, and a center at (x, y), at angle t
function DrawPolygon(x, n, deg, active, col, opacity) {
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = opacity;
    ctx.fillStyle = col;
    let rad = deg * Math.PI / 180;
    let r = 500;
    let y = 540;
    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = active ? '#ffffff' : '#333333';
    ctx.moveTo(x + r * Math.cos(rad), y + r * Math.sin(rad));
    for (let i = 1; i < n; i++) {
        ctx.lineTo(x + r * Math.cos(rad + (i * 2 * Math.PI / n)), y + r * Math.sin(rad + (i * 2 * Math.PI / n)));
    }
    ctx.closePath();
    ctx.fill()
    ctx.stroke();

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function getRandomSynth(n) {
    let nsynth = new Tone.PolySynth().toDestination();
    nsynth.set({
        portamento: 0.0,
        oscillator: {
            type: getRandomOsc(n),
        },
        envelope: {
            attack: 0.001,
            decay: Math.pow(0.25, n + 1),
            sustain: Math.pow(0.75, n + 1),
            release: Math.pow(0.75, n + 1),
        },
    });
    nsynth.volume.value = -8 - (n);
    return nsynth;
}

function getRandomOsc(n) {
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
    let partials = 2 + Math.floor(Math.random() * (n + 1) * (n + 1));
    return synthType + partials;
}

function PlayNote(csynth, currentKey, currentOctave, dif, dur, vol) {
    const transposedNote = Tone.Frequency(`${currentKey}${currentOctave}`).transpose(dif).toNote();
    csynth.triggerAttackRelease(`${transposedNote}`, dur + "n", undefined, vol);
};