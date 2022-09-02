const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1920;
const GAMESIZEY = 1080;

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
var isPlaying = true;
const globalTranspose = -12 + Math.floor(Math.random() * 12);
var curTranspose = 0;

var lifeGrid = [];
var gridXPos = 0;
var gridYPos = 0;
var steps = 0;
var anim = true;

var xNotes = [
    ['C2', 'E2', 'G2', 'B2', 'C3', 'E3', 'G3', 'B3', 'C4', 'E4', 'G4', 'B4', 'C5', 'E5', 'G5', 'B5', ],
    ['C2', 'D2', 'E2', 'G2', 'C3', 'D3', 'E3', 'G3', 'C4', 'D4', 'E4', 'G4', 'C5', 'D5', 'E5', 'G5', ],
    ['C2', 'D2', 'F2', 'G2', 'C3', 'D3', 'F3', 'G3', 'C4', 'D4', 'F4', 'G4', 'C5', 'D5', 'F5', 'G5', ],
];
var yNotes = [
    ['C3', 'E3', 'G3', 'B3', 'C4', 'E4', 'G4', 'B4', 'C5'],
    ['C3', 'D3', 'E3', 'G3', 'C4', 'D4', 'E4', 'G4', 'C5'],
    ['C3', 'D3', 'F3', 'G3', 'C4', 'D4', 'F4', 'G4', 'C5'],
];
var xScale = 0;
var yScale = 0;

var frame = 0;
var firstClick = true;

//#region Game logic goes here

function InitGame() {
    lifeGrid = [];
    for (var y = 0; y < 9; y++) {
        lifeGrid[y] = [];
        for (var x = 0; x < 16; x++) {
            lifeGrid[y][x] = {
                alive: false,
                nextAlive: false,
            };
        }
    }
}

function StepLife() {
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            var alive = lifeGrid[y][x].alive;
            var neighbors = GetNeighbors(x, y);
            if (alive) {
                if (neighbors < 2 || neighbors > 3) {
                    lifeGrid[y][x].nextAlive = false;
                } else {
                    lifeGrid[y][x].nextAlive = true;
                }
            } else {
                if (neighbors == 3) {
                    lifeGrid[y][x].nextAlive = true;
                } else {
                    lifeGrid[y][x].nextAlive = false;
                }
            }
        }
    }
    let changed = false;

    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            if (lifeGrid[y][x].alive != lifeGrid[y][x].nextAlive) {
                changed = true;
            }
            lifeGrid[y][x].alive = lifeGrid[y][x].nextAlive;
        }
    }

}

function GetNeighbors(x, y) {
    var neighbors = 0;
    for (var nextY = y - 1; nextY <= y + 1; nextY++) {
        for (var nextX = x - 1; nextX <= x + 1; nextX++) {
            let checkX = (nextX + 16) % 16;
            let checkY = (nextY + 9) % 9;
            if (nextX == x && nextY == y) continue;
            if (lifeGrid[checkY][checkX].alive) {
                neighbors++;
            }
        }
    }
    return neighbors;
}

function Update() {
    frame++;
    // Game logic here
}

function DrawGame(ts) {
    DrawBars(ts);
    DrawGrid();
    // Game element drawing goes here
}

var last;

function DrawBars(ts) {
    let txPos = (gridXPos * 120);
    let tyPos = (gridYPos * 120);
    if (anim && isPlaying) {
        txPos += (120 * (ts / (Tone.Transport.toSeconds('4n') * 1000)));
        tyPos += (120 * (ts / (Tone.Transport.toSeconds('4n') * 1000)));
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = isPlaying ? '#333399' : '#990000';
    ctx.fillRect(txPos, 0, 120, GAMESIZEY);
    ctx.fillRect(txPos - 1920, 0, 120, GAMESIZEY);
    ctx.fillStyle = isPlaying ? '#339933' : '#990000';
    ctx.fillRect(0, tyPos, GAMESIZEX, 120);
    ctx.fillRect(0, tyPos - 1080, GAMESIZEX, 120);
    ctx.globalAlpha = 1;
}

function DrawGrid() {
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            let dX = (120 * x) + 10;
            let dY = (120 * y) + 10;
            let hue = (frame + (x * y)) % 360;
            if (lifeGrid[y][x].alive) {
                ctx.fillStyle = 'hsl(' + hue + ', 100%, 75%)';
            } else {
                ctx.fillStyle = 'hsl(' + (360 - hue) + ', 25%, 10%)';
            }
            RoundRect(ctx, dX, dY, 100, 100, 10, true, false);
        }
    }
}

//#endregion

//#region Initialization
function StartThings() {
    document.getElementById('start').style.display = 'none';


    Tone.Transport.bpm.value = 130;
    // Do initialization here
    InitGame();
    //KICK.triggerAttackRelease('G2', '1n');
    //HIHAT.triggerAttackRelease('C5', '16n');
    //SNARE.triggerAttackRelease('4n');
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);
    ResizeGame();
    DrawScreen();
    window.setTimeout(stepSeq, 500);
};
//#endregion
var started = false;

var posInStep = 0;

function stepSeq() {
    if (!started) {
        Tone.Transport.start();
        started = true;
    }
    if (isPlaying) {
        // Advance the grid
        StepLife();
        gridXPos = (gridXPos + 1) % 16;
        gridYPos = (gridYPos + 1) % 9;

        // Play the notes
        let xsnotes = Shuffle(xNotes[xScale].filter((_, index) => {
            return lifeGrid[gridYPos][index].alive;
        }).map(note => { return Tone.Frequency(note).transpose(globalTranspose + curTranspose).toNote() })).slice(0, 3);
        XSynth.triggerAttackRelease(xsnotes, '8n');

        ysnotes = Shuffle(yNotes[yScale].filter((_, index) => {
            return lifeGrid[index][gridXPos].alive;
        }).map(note => { return Tone.Frequency(note).transpose(globalTranspose + curTranspose).toNote() })).slice(0, 3);
        YSynth.triggerAttackRelease(ysnotes, '8n');

        if (xsnotes.length + ysnotes.length == 0) {
            lifeGrid[gridYPos][gridXPos].alive = true;
            lifeGrid[gridYPos][gridXPos].nextAlive = true;
            if (Math.random() > 0.5) {
                lifeGrid[(gridYPos + 1) % 9][gridXPos].alive = true;
                lifeGrid[(gridYPos + 1) % 9][gridXPos].nextAlive = true;
                lifeGrid[(gridYPos + 8) % 9][gridXPos].alive = true;
                lifeGrid[(gridYPos + 8) % 9][gridXPos].nextAlive = true;
            } else {
                lifeGrid[gridYPos][(gridXPos + 1) % 16].alive = true;
                lifeGrid[gridYPos][(gridXPos + 1) % 16].nextAlive = true;
                lifeGrid[gridYPos][(gridXPos + 15) % 16].alive = true;
                lifeGrid[gridYPos][(gridXPos + 15) % 16].nextAlive = true;
            }
        } else if (xsnotes.length == 0 || ysnotes.length == 0 || Math.random() > 0.5) {
            if (steps % 2 == 1) { SNARE.triggerAttackRelease('16n'); }
        }

        if (lifeGrid[gridYPos][gridXPos].alive) {
            KICK.triggerAttackRelease('G2', '1n');
        }

        if ((gridXPos + 1) % 16 == 0) {
            curTranspose += (steps % 2 == 0 ? 5 : 2);
            curTranspose %= 12;
        }
        if ((gridYPos + 1) % 9 == 0) {
            xScale = (xScale + 1) % xNotes.length;
            yScale = (yScale + 1) % yNotes.length;
        }
    }

    steps++;
    posInStep = 0;
    window.setTimeout(stepSeq, Tone.Transport.toSeconds('4n') * 1000);
}

//#region Handlers
function HandleMouse(e) {
    if (firstClick) {
        firstClick = false;
        return;
    }
    if (ModalUp) return; // Ignore the mouse if a Modal is currently displayed
    // mX and mY are Mouse X and Y in "Source Screen" coordinates
    let mX = (e.offsetX - screenOffsetX) / gameScale;
    let mY = (e.offsetY - screenOffsetY) / gameScale;

    let cX = Math.floor(mX / 120);
    let cY = Math.floor(mY / 120);
    if (cX < 0 || cX > 15 || cY < 0 || cY > 8) return;
    lifeGrid[cY][cX].alive = !(lifeGrid[cY][cX].alive);
    // Mouse handling here
}

function HandleKeys(e) {
    if (ModalUp) return; // Ignore the keyboard if a Modal is currently displayed
    if (e.keyCode == 32) { // Spacebar
        isPlaying = !isPlaying;
        if (!isPlaying) {
            Tone.Transport.stop();
        } else {
            Tone.Transport.start();
            posInStep = 0;
        }
    } else if (e.keyCode == 38) { // Up arrow
        Tone.Transport.bpm.value += 5;
    } else if (e.keyCode == 40) { // Down arrow
        Tone.Transport.bpm.value -= 5;
    } else if (e.keyCode == 37) { // Right arrow, go up a fifth
        globalTranspose += 7;
        globalTranspose %= 12;
    } else if (e.keyCode == 39) { // Left arrow, go down a fifth
        globalTranspose += 5;
        globalTranspose %= 12;
    } else if (e.keyCode == 67) { // C
        ClearBoard();
    } else if (e.keyCode == 82) { // R
        RandomizeBoard();
    }
    // Key handling here
}
//#endregion

function RandomizeBoard() {
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            lifeGrid[y][x].alive = Math.random() > 0.5;
            lifeGrid[y][x].nextAlive = lifeGrid[y][x].alive;
        }
    }
}

function ClearBoard() {
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            lifeGrid[y][x].alive = false;
            lifeGrid[y][x].nextAlive = false;
        }
    }
}

//#region Draw Utilities
function DrawScreen(ts) {
    if (!last) { last = ts; }

    // Clear the little canvas
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    posInStep += ts - last;
    DrawGame(posInStep);
    Update();
    last = ts;

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

//#endregion

//#region Synths

const KICK = new Tone.MembraneSynth({
    "envelope": {
        "attack": 0.001,
        "decay": 0.2,
        "sustain": 0.0,
        "release": 0.2
    },
    "octaves": 2,
    "pitchDecay": 0.008,
    "octaveRange": 0.5,
    "oscillator": {
        "type": "sine"
    },
    "volume": -14
}).toDestination();

const SNARE = new Tone.NoiseSynth({
    noise: {
        type: "white",
        playbackRate: 1
    },
    envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0.1,
        release: 0.2
    }
}).toDestination();
const hatFilter = new Tone.Filter(12000, 'highpass').toDestination();
SNARE.connect(hatFilter);
SNARE.volume.value = -18;

const HIHAT = new Tone.MetalSynth({
    envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.1,
        release: 0.4
    },
    frequency: 2500,
    modulationIndex: 32,
    resonance: 1000,
    octaves: 1.2,
}).toDestination();
HIHAT.volume.value = -18;

const chordSynth = new Tone.PolySynth(Tone.Synth);
chordSynth.set({
    oscillator: {
        type: "fatsawtooth"
    },
    envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 1,
        release: 1
    },
    portamento: 0.2
});
chordSynth.volume.value = -24;
const filter = new Tone.Filter(250, "lowpass").toDestination();
const chorus = new Tone.Chorus("1:0:0", 2.5, 1).toDestination();
const reverb = new Tone.Freeverb().toDestination();

reverb.connect(filter);
chorus.connect(reverb);
chordSynth.connect(chorus);

//Add bass for the root note
const bassSynth = new Tone.Synth({
    oscillator: {
        type: "square2"
    },
    envelope: {
        attack: "0:2",
        decay: 0.1,
        sustain: 1,
        release: 3
    }
}).toDestination();
bassSynth.volume.value = -18;

var ding = new Tone.PolySynth(Tone.FMSynth).toDestination();
ding.set({
    harmonicity: 8,
    modulationIndex: 2,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0.1,
        release: 2
    },
    modulation: {
        type: "square"
    },
    modulationEnvelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0,
        release: 0.2
    }
});
ding.volume.value = -12;

function triggerSynthNote(chord, duration, time) {
    const lowRootNote = Tone.Frequency(chord[0]).transpose(-12);
    chordSynth.triggerAttackRelease(chord, duration, time);
    bassSynth.triggerAttackRelease(lowRootNote, duration, time);
}

//#endregion

function RoundRect(dctx, x, y, w, h, r, fill = false, stroke = true) {
    dctx.beginPath();
    dctx.moveTo(x + r, y);
    dctx.lineTo(x + w - r, y);
    dctx.quadraticCurveTo(x + w, y, x + w, y + r);
    dctx.lineTo(x + w, y + h - r);
    dctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    dctx.lineTo(x + r, y + h);
    dctx.quadraticCurveTo(x, y + h, x, y + h - r);
    dctx.lineTo(x, y + r);
    dctx.quadraticCurveTo(x, y, x + r, y);
    dctx.closePath();
    if (fill) {
        dctx.fill();
    }
    if (stroke) {
        dctx.stroke();
    }
}

// Synths
var XSynth = new Tone.PolySynth(Tone.MonoSynth).toDestination();
XSynth.set({
    volume: -12,
    oscillator: {
        type: "sawtooth"
    },
    filter: {
        Q: 2,
        type: "bandpass",
        rolloff: -12
    },
    envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.6
    },
    filterEnvelope: {
        attack: 0.02,
        decay: 0.4,
        sustain: 1,
        release: 0.7,
        releaseCurve: "linear",
        baseFrequency: 20,
        octaves: 5
    }
});

var YSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
YSynth.set({
    harmonicity: 8,
    modulationIndex: 2,
    oscillator: {
        type: "sine"
    },
    envelope: {
        attack: 0.001,
        decay: 2,
        sustain: 0.1,
        release: 2
    },
    modulation: {
        type: "square"
    },
    modulationEnvelope: {
        attack: 0.002,
        decay: 0.2,
        sustain: 0,
        release: 0.2
    }
});
YSynth.volume.value = -12;