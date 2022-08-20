// Initialize the canvas
const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1080;
const GAMESIZEY = 1080;
const DIRECTIONS = ["N", "W", "S", "E"];
const DIR_ARROWS = ["↑", "←", "↓", "→"];
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
var startNote = 0;

// Map stuff
var facing = 0; // 0 North, 1 West, 2 South, 3 East
var nodes = [];
var hue = 0;
var bghue = 0;
var basehue = 0;
var size = 10;
var nextUserDir = "";

// Music stuff
const MAJOR = [0, 4, 7, 12];
const MINOR = [0, 3, 7, 12];
const ROOTNOTES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

const SAYINGS = [
    "Use Arrow Keys or 'L' / 'R' to choose the next direction",
    "The decisions you make will determine the future.",
    "Choosing not to decide is a decision by itself.",
    "Little changes can make big changes.",
    "Early changes can radically change the future.",
    "The future is a place you can't go back to.",
    "In every end, we can find a new beginning.",
    "Sometimes a little uncertainty can be fun.",
    "Sometimes, there is safety in a sense of control.",
    "Either way,",
    "the choice is yours."
]

const songPath = {
    "A": {
        "transpose": 2,
        "tones": MINOR,
        "next": ["B", "G", "C"],
    },
    "B": {
        "transpose": 7,
        "tones": MAJOR,
        "next": ["C", "E", "D"],
    },
    "C": {
        "transpose": 4,
        "tones": MINOR,
        "next": ["D", "A", "E"],
    },
    "D": {
        "transpose": 9,
        "tones": MINOR,
        "next": ["E", "B", "F"],
    },
    "E": {
        "transpose": 5,
        "tones": MAJOR,
        "next": ["F", "C", "G"],
    },
    "F": {
        "transpose": 2,
        "tones": MINOR,
        "next": ["C", "B", "G"],
    },
    "G": {
        "transpose": 7,
        "tones": MAJOR,
        "next": ["C", "H", "D"],
    },
    "H": {
        "transpose": 0,
        "tones": MAJOR,
        "next": ["E", "A", "B"],
    },
}

var ChordSynth = null;
var BassSynth = null;
var RootNote = "C";
var CurrentStep = "H";
var RootSteps = 0;

function startThings() {
    document.getElementById('start').style.display = 'none';

    // Do initialization here
    Init();
    window.addEventListener('resize', ResizeGame);
    window.setTimeout(PlayNote, 1000);
    ResizeGame();
    window.requestAnimationFrame(DrawScreen);
    window.addEventListener('keydown', KeyDown);
};

function Update() {}

function KeyDown(e) {
    if (nextUserDir == "") {
        if (e.keyCode == 76) { // L
            nextUserDir = "L";
        } else if (e.keyCode == 82) { // R
            nextUserDir = "R";
        } else if (e.keyCode == '37') { // Left arrow
            switch (facing) {
                case 0:
                    nextUserDir = "L";
                    break;
                case 1:
                    nextUserDir = "C";
                    break;
                case 2:
                    nextUserDir = "R";
                    break;
            }
        } else if (e.keyCode == '38') { // Up arrow
            switch (facing) {
                case 0:
                    nextUserDir = "C";
                    break;
                case 1:
                    nextUserDir = "R";
                    break;
                case 3:
                    nextUserDir = "L";
                    break;
            }
        } else if (e.keyCode == '39') { // Right arrow
            switch (facing) {
                case 0:
                    nextUserDir = "R";
                    break;
                case 2:
                    nextUserDir = "L";
                    break;
                case 3:
                    nextUserDir = "C";
                    break;
            }
        } else if (e.keyCode == '40') { // Down arrow
            switch (facing) {
                case 1:
                    nextUserDir = "L";
                    break;
                case 2:
                    nextUserDir = "C";
                    break;
                case 3:
                    nextUserDir = "R";
                    break;

            }
        }
    }
}

function DrawGame() {
    // Draw the map
    let mapX = GAMESIZEX / 2;
    let mapY = GAMESIZEY / 2;

    // Draw the lines first
    facing = 0;
    hue = basehue;
    let lineWeight = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.moveTo(mapX, mapY);
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, 50%)';
        hue = (hue + 5) % 360;
        ctx.lineWidth = lineWeight;
        lineWeight *= 1.05;
        switch (nodes[i]) {
            case 'L':
                facing = (facing + 1) % 4;
                break;
            case 'R':
                facing = (facing + 3) % 4;
                break;
        }
        switch (facing) {
            case 0: // North
                ctx.lineTo(mapX, mapY - (30 + (3 * i)));
                mapY -= (30 + (3 * i));
                break;
            case 1: // West
                ctx.lineTo(mapX - (30 + (3 * i)), mapY);
                mapX -= (30 + (3 * i));
                break;
            case 2: // South
                ctx.lineTo(mapX, mapY + (30 + (3 * i)));
                mapY += (30 + (3 * i));
                break;
            case 3: // East
                ctx.lineTo(mapX + (30 + (3 * i)), mapY);
                mapX += (30 + (3 * i));
                break;
        }
        ctx.stroke();
    }
    // Then the circles
    mapX = GAMESIZEX / 2;
    mapY = GAMESIZEY / 2;
    hue = basehue;
    facing = 0;
    for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.strokeStyle = 'hsl(' + hue + ', 100%, 50%)';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#000000';
        hue = (hue + 5) % 360;
        switch (nodes[i]) {
            case 'L':
                facing = (facing + 1) % 4;
                break;
            case 'R':
                facing = (facing + 3) % 4;
                break;
        }
        switch (facing) {
            case 0: // North
                mapY -= (30 + (3 * i));
                if (i == nodes.length - 1) { ctx.ellipse(mapX, mapY, (size), (size), 0, 0, Math.PI * 2); }
                break;
            case 1: // West
                mapX -= (30 + (3 * i));
                if (i == nodes.length - 1) { ctx.ellipse(mapX, mapY, (size), (size), 0, 0, Math.PI * 2); }
                break;
            case 2: // South
                mapY += (30 + (3 * i));
                if (i == nodes.length - 1) { ctx.ellipse(mapX, mapY, (size), (size), 0, 0, Math.PI * 2); }
                break;
            case 3: // East
                mapX += (30 + (3 * i));
                if (i == nodes.length - 1) { ctx.ellipse(mapX, mapY, (size), (size), 0, 0, Math.PI * 2); }
                break;
        }
        ctx.fill();
        ctx.stroke();
    }

    if (nextUserDir != "") {
        let nextFacing = facing;
        if (nextUserDir == "L") {
            nextFacing += 1;
            nextFacing %= 4;
        } else if (nextUserDir == "R") {
            nextFacing += 3;
            nextFacing %= 4;
        }
        let dirChar = DIR_ARROWS[nextFacing];
        ctx.font = "bold " + size + "px 'Arial', 'Helvetica', sans-serif";
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dirChar, mapX, mapY);
    }
    if (RootSteps % 2 == 0 && RootSteps < 21) {
        ctx.font = "bold 32px 'Baloo 2', sans-serif";
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(SAYINGS[RootSteps / 2], GAMESIZEX / 2, 30);
    }
}

function Init() {
    const now = Tone.now();
    Tone.Transport.start();

    ChordSynth = new Tone.PolySynth().toDestination();
    ChordSynth.set({
        portamento: 0.0,
        oscillator: {
            type: getRandomOsc(4),
        },
        envelope: {
            attack: 0.33 + (Math.random() * 0.65),
            decay: 0.33 + (Math.random() * 0.65),
            sustain: 0.25 + (Math.random() * 0.5),
            release: 0.33 + (Math.random() * 0.65),
        },
    });
    ChordSynth.volume.value = -18;

    BassSynth = new Tone.PolySynth().toDestination();
    BassSynth.set({
        portamento: 0.0,
        oscillator: {
            type: getRandomOsc(6),
        },
        envelope: {
            attack: (Math.random() * 0.05),
            decay: (Math.random() * 0.2),
            sustain: 0.5 + (Math.random() * 0.25),
            release: (Math.random() * 0.2),
        },
    });
    BassSynth.volume.value = -12;
    // Get a random root note
    startNote = Math.floor(Math.random() * ROOTNOTES.length);
    basehue = hue = 27 * startNote;
    RootNote = ROOTNOTES[startNote];
}

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

function getRandomOsc(parts) {
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
    let partials = 1 + Math.ceil(Math.random() * parts);
    return synthType + partials;
}

function PlayNote() {
    let stepOpts = songPath[CurrentStep].next.length;
    let stepDir = Math.floor(Math.random() * stepOpts);
    let treeDir = "C";
    if (stepOpts == 2) {
        treeDir = "L";
        if (stepDir == 1) { treeDir = "R"; }
    } else if (stepOpts == 3) {
        if (stepDir == 0) { treeDir = "L"; } else if (stepDir == 2) { treeDir = "R"; }
    }
    if (nextUserDir != "") {
        treeDir = nextUserDir;
        switch (nextUserDir) {
            case "L":
                stepDir = 0;
                break;
            case "R":
                stepDir = 2;
                break;
            case "C":
                stepDir = 1;
                break;
        }
        nextUserDir = "";
    }
    console.log(`${CurrentStep} ${treeDir}`);

    if (nodes.length == 0) {
        nodes.push("S");
    } else {
        nodes.push(treeDir);
    }
    size++;
    playPart(songPath[CurrentStep].transpose, songPath[CurrentStep].tones);
    //thisPart.start();
    CurrentStep = songPath[CurrentStep].next[stepDir];
    if (CurrentStep == "H") {
        RootSteps++;
        nodes = [];
        size = 10;
        basehue = hue;
        console.log(`Root Steps: ${RootSteps}`);
    }
    window.setTimeout(PlayNote, 2000);
}

function playPart(curTrans, intervals) {
    let curNote = TransposeBase(RootNote, 4, curTrans);
    let notes = intervals.map(interval => {
        return Tone.Frequency(curNote).transpose(interval).toNote();
    });
    if (RootSteps > 0) {
        // Bass stuff
        let bass = notes[0];
        BassSynth.releaseAll();
        let deep = (Math.random() < 0.25 ? "-12" : "-24"); // Deep bass
        bass = Tone.Frequency(bass).transpose(deep).toNote();
        let secondbass = bass;
        let thirdbass = bass;
        let fourthbass = bass;
        if (RootSteps > 2 && RootSteps % 3 != 0) {
            if (Math.random() < 0.25) {
                secondbass = Tone.Frequency(bass).transpose(-7).toNote();
            } else if (Math.random() > 0.75) {
                secondbass = Tone.Frequency(bass).transpose(7).toNote();
            }
        }
        if (RootSteps > 3 && RootSteps % 4 != 0) {
            if (Math.random() < 0.25) {
                thirdbass = Tone.Frequency(bass).transpose(-7).toNote();
            } else if (Math.random() > 0.75) {
                thirdbass = Tone.Frequency(bass).transpose(7).toNote();
            }
        }
        if (RootSteps > 4 && RootSteps % 5 != 0) {
            if (Math.random() < 0.25) {
                fourthbass = Tone.Frequency(bass).transpose(-7).toNote();
            } else if (Math.random() > 0.75) {
                fourthbass = Tone.Frequency(bass).transpose(7).toNote();
            }
        }
        if (Math.random() > 0.01) { BassSynth.triggerAttackRelease(bass, "0:0:3", Tone.now()); }
        if (Math.random() > 0.04) { BassSynth.triggerAttackRelease(secondbass, "0:0:3", "+0:1:0"); }
        if (Math.random() > 0.02) { BassSynth.triggerAttackRelease(thirdbass, "0:0:3", "+0:2:0"); }
        if (Math.random() > 0.08) { BassSynth.triggerAttackRelease(fourthbass, "0:0:3", "+0:3:0"); }

        // Chord stuff
        notes = Shuffle(notes);
        notes.shift();
    }
    ChordSynth.releaseAll();
    ChordSynth.triggerAttackRelease(notes, "0:3:3", Tone.now());
}

function TransposeBase(base, oct, dif) {
    const transposedNote = Tone.Frequency(`${base}${oct}`).transpose(dif).toNote();
    const splitTransposedNote = transposedNote.split("");
    const accidental = Number.isNaN(Number(splitTransposedNote[1])) ?
        splitTransposedNote[1] :
        "";
    transposedBaseNote = splitTransposedNote[0] + accidental;
    return transposedBaseNote + "4";
}

//#region Draw Utilities
function DrawScreen() {
    Update();

    // Clear the little canvas
    ctx.fillStyle = bgcolor;
    ctx.globalAlpha = 0.018;
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    ctx.globalAlpha = 1;
    DrawGame();
    //ctx.globalAlpha = 1;

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.globalAlpha = 0.03;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.globalAlpha = 1;
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