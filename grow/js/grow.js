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

var plantSeeds = [];
var flowers = [];

var frame = 0;
var loops = 0;

var keyChanges = [{
        root: 0,
        scale: 'major',
    },
    {
        root: 2,
        scale: 'minor',
    },
    {
        root: 4,
        scale: 'minor',
    },
    {
        root: 5,
        scale: 'major',
    },
    {
        root: 7,
        scale: 'major',
    }
];

var MAJORCHORD = ['C3', 'E3', 'F3', 'G3', 'C4', 'E4', 'F4', 'G4', ];
var MINORCHORD = ['C3', 'D3', 'Eb3', 'G3', 'C4', 'D4', 'Eb4', 'G4', ];

var globalTranspose = -6 + Math.floor(Math.random() * 12);



//#region Game logic goes here

function getRandomGreen() {
    let h = 75 + Math.floor(Math.random() * 50);
    let s = 75 + Math.floor(Math.random() * 25);
    let l = 33 + Math.floor(Math.random() * 33);
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
}

function InitGame() {
    // bgcolor = getRandomRgb(0, 64);
}

function Update() {
    // Game logic here
}

function DrawGame() {
    for (let i = 0; i < plantSeeds.length; i++) {
        let seed = plantSeeds[i];

        ctx.strokeStyle = seed.col;
        ctx.lineWidth = seed.weight;
        ctx.beginPath();
        ctx.moveTo(seed.x, seed.y);
        ctx.lineTo(seed.x + seed.dx, seed.y + seed.dy);
        ctx.stroke();
        seed.x += seed.dx;
        seed.y += seed.dy;
        if (seed.x < 0 || seed.x > GAMESIZEX || seed.y < 0 || seed.y > GAMESIZEY) {
            seed.dead = true;
        }
    }

    for (let i = 0; i < flowers.length; i++) {
        let flower = flowers[i];
        DrawFlower(ctx, flower.numPetals, flower.radius, flower.x, flower.y, flower.col, flower.angle)
        flower.radius += Math.random();
        flower.angle += flower.angleMod;
    }
    // Game element drawing goes here
}

//#endregion

//#region Initialization
function StartThings() {
    document.getElementById('start').style.display = 'none';
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    Tone.Transport.bpm.value = 180;
    Tone.Transport.start();
    // Do initialization here
    InitGame();
    ResizeGame();
    DrawScreen();
    //KICK.triggerAttackRelease('G2', '1n');
    //HIHAT.triggerAttackRelease('C5', '16n');
    //SNARE.triggerAttackRelease('4n');
    window.setTimeout(playDrumLoop, 500);
};
//#endregion

function playDrumLoop() {
    flowers = [];
    if (plantSeeds.length == 0) {
        globalTranspose += 5;
        globalTranspose %= 12;
        ctx.fillStyle = '#000000';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
        ctx.globalAlpha = 1;
        plantSeeds.push({
            x: (GAMESIZEX / 4) + (Math.random() * (GAMESIZEX / 2)),
            y: (GAMESIZEY),
            dx: 0,
            dy: -1,
            weight: 10,
            new: true,
            dead: false,
            col: getRandomGreen(),
        });
    }
    for (let i = 0; i < plantSeeds.length; i++) {
        if (plantSeeds[i].new) {
            plantSeeds[i].new = false;
        } else {
            if (Math.random() < 0.25) {
                flowers.push({
                    numPetals: Math.floor(Math.random() * 10) + 4,
                    radius: 5 + Math.random() * 10,
                    x: plantSeeds[i].x,
                    y: plantSeeds[i].y,
                    col: 'hsl(' + Math.floor(Math.random() * 360) + ', 100%, 50%)',
                    angle: Math.random() * Math.PI * 2,
                    angleMod: Math.sign(0.5 - Math.random()) * (Math.PI / 180)
                });
                plantSeeds[i].dead = true;
            } else if (Math.random() > 0.4) {
                plantSeeds.push({
                    x: plantSeeds[i].x,
                    y: plantSeeds[i].y,
                    dx: (0.5 - Math.random()),
                    dy: (-Math.random()) / 2,
                    weight: Math.max(plantSeeds[i].weight - 1, 1),
                    new: true,
                    col: getRandomGreen(),
                });
                if (Math.random() > 0.5) {
                    plantSeeds.push({
                        x: plantSeeds[i].x,
                        y: plantSeeds[i].y,
                        dx: (0.5 - Math.random()),
                        dy: (-Math.random()) / 2,
                        weight: Math.max(plantSeeds[i].weight - 1, 1),
                        new: true,
                        col: getRandomGreen(),
                    });
                    if (Math.random() > 0.6) {
                        plantSeeds.push({
                            x: plantSeeds[i].x,
                            y: plantSeeds[i].y,
                            dx: (0.5 - Math.random()),
                            dy: (-Math.random()) / 2,
                            weight: Math.max(plantSeeds[i].weight - 1, 1),
                            new: true,
                            col: getRandomGreen(),
                        });
                    }
                }
                plantSeeds[i].dead = true;
            } else {
                plantSeeds[i].dx = plantSeeds[i].dx * 0.8;
                plantSeeds[i].dy = plantSeeds[i].dy * 0.8;
            }
            if (plantSeeds[i].weight > 1) {
                plantSeeds[i].weight--;
            } else {
                flowers.push({
                    numPetals: Math.floor(Math.random() * 10) + 4,
                    radius: 5 + Math.random() * 10,
                    x: plantSeeds[i].x,
                    y: plantSeeds[i].y,
                    col: 'hsl(' + Math.floor(Math.random() * 360) + ', 100%, 50%)',
                    angle: Math.random() * Math.PI * 2,
                    angleMod: Math.sign(0.5 - Math.random()) * (Math.PI / 180)
                });

                plantSeeds[i].dead = true;
            }
        }
    }
    plantSeeds = plantSeeds.filter(seed => !seed.dead);

    let numNotes = Math.min(plantSeeds.length, MAJORCHORD.length, 6)
    let curNotes = MAJORCHORD.slice();
    for (let i = 0; i < numNotes; i++) {
        let bass = [Tone.Frequency(curNotes.shift()).transpose(globalTranspose - 6).toNote()];
        triggerSynthNote(bass, '8n', '+0:' + i);
        Shuffle(curNotes);
    }

    if (flowers.length > 0) {
        let numNotes = Math.min(flowers.length, MAJORCHORD.length)
        let curNotes = MAJORCHORD.slice();
        for (let i = 0; i < numNotes; i++) {
            Shuffle(curNotes);
            let note = Tone.Frequency(curNotes.shift()).transpose(globalTranspose + 6).toNote()
            ding.triggerAttackRelease(note, '32n', '+0:0:' + i);
        }
    }


    if (loops > 2) { KICK.triggerAttackRelease('G2', '1n', '+0:0'); }
    if (loops > 4) { HIHAT.triggerAttackRelease('C6', '8n', '+0:3'); }
    if (loops > 8) {
        if (Math.random() > 0.5) { SNARE.triggerAttackRelease('32n', '+0:1'); }
        SNARE.triggerAttackRelease('32n', '+0:2');
        if (Math.random() > 0.5) { SNARE.triggerAttackRelease('32n', '+0:4'); }
        SNARE.triggerAttackRelease('32n', '+0:5');
    }
    loops++;
    window.setTimeout(playDrumLoop, 2000);
}

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
    // ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);

    // Draw the game elements
    ctx.lineCap = 'round';
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

function DrawFlower(fctx, numPetals, radius, x, y, col, angle) {

    fctx.beginPath();

    // draw petals
    for (var n = 0; n < numPetals; n++) {
        var theta1 = (((Math.PI * 2) / numPetals) * (n + 1));
        var theta2 = (((Math.PI * 2) / numPetals) * (n));

        var x1 = (radius * Math.sin(theta1 + angle)) + x;
        var y1 = (radius * Math.cos(theta1 + angle)) + y;
        var x2 = (radius * Math.sin(theta2 + angle)) + x;
        var y2 = (radius * Math.cos(theta2 + angle)) + y;

        fctx.moveTo(x, y);
        fctx.bezierCurveTo(x1, y1, x2, y2, x, y);
    }

    fctx.closePath();
    fctx.fillStyle = col;
    fctx.fill();
    fctx.strokeStyle = 'black';
    fctx.lineWidth = 1;
    if (Math.random() > 0.5) { fctx.stroke(); }

    // draw yellow center
    fctx.beginPath();
    fctx.arc(x, y, radius / 6, 0, 2 * Math.PI, false);
    fctx.fillStyle = 'yellow';
    fctx.fill();
    fctx.stroke();
};