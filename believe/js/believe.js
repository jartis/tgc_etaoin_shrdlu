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
var frame = 0;
var beat = 0;

var nums = [];
var numsIndex = 0;

var notesOn = [];

const BPM = 125;
const STEPMS = 480;
var XD = 0;

var notes = ['C3', 'D3', 'E3', 'G3', 'C4', 'D4', 'E4', 'G4'];
var bassSynth;
var leadSynth;
var currentTranspose = 0;
const randTrans = -6 + Math.floor(Math.random() * 12);
const Transpositions = [0, 5, 0, -5];

//#region Game logic goes here

function Init() {
    document.getElementById('start').style.display = 'none';

    // Do initialization here
    for (let i = 0; i < 256; i++) {
        nums.push(intToBinaryArray(i));
    }
    //nums.reverse();
    nums = Shuffle(nums);
    makeBassSynth();
    makeLeadSynth();
    Tone.Transport.bpm.value = BPM;

    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    ResizeGame();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    DrawScreen();
    window.setTimeout(stepNotes, 480);
    // bgcolor = getRandomRgb(0, 64);
}

function stepNotes() {
    beat++;
    let checkFunc = getFullList;
    if (numsIndex == 287) {
        let note = Tone.Frequency("C3").transpose(randTrans - 12).toNote();
        bassSynth.triggerAttackRelease(note, "2m");
        window.setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                notesOn[i] = false;
            }
        }, 3840);
    } else {
        if (numsIndex > 287) {
            checkFunc = getNothing;
        } else if (numsIndex > 191) {
            if (numsIndex % 4 == 0) {
                checkFunc = getChangedList;
            } else {
                checkFunc = getSingleList;
            }
        } else if (numsIndex > 127) {
            checkFunc = getTurnedOnList;
        } else if (numsIndex > 63) {
            checkFunc = getChangedList;
        }
        if (numsIndex)
            XD = Math.floor(Math.random() * 3) - 1;
        for (let i = 0; i < 8; i++) {
            notesOn[i] = false;
        }
        let list = checkFunc(nums[numsIndex % 255], nums[(numsIndex + 1) % 255])
        if (list.length == 0 && numsIndex < 191) {
            let t = nums[(numsIndex + 1) % 255];
            for (let i = 0; i < 8; i++) {
                if (t[i]) {
                    list.push(i);
                }
            }
        }
        let theseNotes = [];
        let octPose = -12;
        list.forEach(i => {
            notesOn[i] = true;
            let n = Tone.Frequency(notes[i]).transpose(Transpositions[currentTranspose] + randTrans + octPose).toNote();
            theseNotes.push(n);
            octPose = 12;
        });

        let durs = [];
        for (let i = 0; i < list.length; i++) {
            durs.push('8n');
        }
        if (list.length > 0) {
            durs[0] = '2n';
        }

        if (theseNotes.length > 0) {
            bassSynth.triggerAttackRelease(theseNotes.shift(), durs.shift());
        }
        leadSynth.triggerAttackRelease(theseNotes, durs);
        numsIndex++;
        currentTranspose = Math.floor(numsIndex / 32) % Transpositions.length;
        if (numsIndex >= nums.length) {
            //numsIndex = 0;
        }
        window.setTimeout(stepNotes, STEPMS);
    }
}

function makeLeadSynth() {
    leadSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
    leadSynth.set({
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
    leadSynth.volume.value = -10;
}

function makeBassSynth() {
    bassSynth = new Tone.PolySynth(Tone.FMSynth).toDestination();
    bassSynth.volume.value = -12;
    bassSynth.set({
        harmonicity: 3.01,
        modulationIndex: 14,
        oscillator: {
            type: "triangle"
        },
        envelope: {
            attack: 0.2,
            decay: 0.3,
            sustain: 0.9,
            release: 1.2
        },
        modulation: {
            type: "square"
        },
        modulationEnvelope: {
            attack: 0.01,
            decay: 0.5,
            sustain: 0.2,
            release: 0.1
        }
    });
}

function intToBinaryArray(i) {
    return [
        (i & 1) > 0,
        (i & 2) > 0,
        (i & 4) > 0,
        (i & 8) > 0,
        (i & 16) > 0,
        (i & 32) > 0,
        (i & 64) > 0,
        (i & 128) > 0
    ];
}

function getFullList(oldState, newState) {
    let res = [];
    for (let i = 0; i < 8; i++) {
        if (oldState[i]) { res.push(i); }
    }
    return res;
}

function getTurnedOnList(oldState, newState) {
    let res = [];
    for (let i = 0; i < 8; i++) {
        if (newState[i] && !oldState[i]) { res.push(i); }
    }
    return res;
}

function getChangedList(oldState, newState) {
    let res = [];
    for (let i = 0; i < 8; i++) {
        if (newState[i] != oldState[i]) { res.push(i); }
    }
    return res;
}

function getSingleList(oldState, newState) {
    for (let i = 0; i < 8; i++) {
        if (newState[i] && !oldState[i]) { return [i]; }
    }
    return [];
}

function getNothing() {
    return [];
}

function Update() {
    frame++;
    // Game logic here
}

function DrawGame() {
    ctx.drawImage(srcCanvas, XD, -1, srcCanvas.width, srcCanvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, srcCanvas.height - 1, srcCanvas.width, 1);
    for (let i = 0; i < 8; i++) {
        if (notesOn[i]) {
            //let r = 
            let hue = ((45 * i) + frame + (45 * currentTranspose)) % 360;
            ctx.fillStyle = 'hsl(' + hue + ', 50%, 50%)';
            ctx.fillRect((i * srcCanvas.width / 8) + (srcCanvas.width / 16) - (beat), srcCanvas.height - 1, (beat * 2), 1);
        }
    }
    // Game element drawing goes here
}

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