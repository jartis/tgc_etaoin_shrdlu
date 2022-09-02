const PORTRAIT = 1;
const LANDSCAPE = 0;
const GAMESIZEX = 1920;
const GAMESIZEY = 1080;

// Initialize the canvas
var srcCanvas = document.createElement('canvas');
srcCanvas.width = GAMESIZEX;
srcCanvas.height = GAMESIZEY;
var confettiCanvas = document.createElement('canvas');
confettiCanvas.width = GAMESIZEX;
confettiCanvas.height = GAMESIZEY;

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

var drawBars = false;
var hBarPos = 0;
var vBarPos = 0;
var hBarD = 2;
var vBarD = 2;
var hBarCol = GetRandomPurple();
var vBarCol = GetRandomPurple();

var hearts = [];
var firstClick = true;

var canAddHeart = true;

var globalTranspose = Math.floor(Math.random() * 12);
//#region Game logic goes here

var progs = [{
        notes: ["C4", "D4", "E4", "G4", "E4", "G3", "D4", "C4", "D4", "E4"],
        durs: ["4n", "4n", "4n", "2n", "2n", "4n", "4n", "4n", "4n", "1n"],
        offsets: [0, 1, 2, 3, 5, 7, 8, 9, 10, 11],

    }, {
        notes: ["E4", "F#4", "G4", "B4", "G4", "B3", "F#4", "E4", "F#4", "G4"],
        durs: ["4n", "4n", "4n", "2n", "2n", "4n", "4n", "4n", "4n", "1n"],
        offsets: [0, 1, 2, 3, 5, 7, 8, 9, 10, 11],
    },
    {
        notes: ["F3", "G3", "A3", "C4", "A3", "C3", "G3", "F3", "G3", "A3"],
        durs: ["4n", "4n", "4n", "2n", "2n", "4n", "4n", "4n", "4n", "1n"],
        offsets: [0, 1, 2, 3, 5, 7, 8, 9, 10, 11],
    },
    {
        notes: ["G3", "A3", "B3", "D4", "B3", "D3", "G3"],
        durs: ["4n", "4n", "4n", "2n", "2n", "4n", "2m"],
        offsets: [0, 1, 2, 3, 5, 7, 8],
    },
];
var seqPos = 0;
var seqCount = 0;

function InitGame() {
    Tone.Transport.bpm.value = 150;
    Tone.Transport.start('+0.5');

    // bgcolor = getRandomRgb(0, 64);
    window.setTimeout(stepSeq, 500);
}

function stepSeq() {
    if (seqCount == 4) {
        for (let i = 0; i < 7; i++) {
            hearts.push(MakeNewHeart());
        }
    }
    if (hearts.length > 0 && seqCount % 4 == 0) {
        if (Math.random() < 0.5) { hearts.push(MakeNewHeart()) };
    }
    let curProg = progs[seqPos];
    let curNotes = curProg.notes.map(n => Tone.Frequency(n).transpose(globalTranspose).toNote());
    let curDurs = curProg.durs.slice();
    let curOffsets = curProg.offsets.slice();
    if (seqCount > 7 && hearts.length > 1) {
        for (let i = 0; i < curOffsets.length; i++) {
            let offset = '+0:' + curOffsets[i];
            if (Math.floor((seqCount - 3) / 8) % 3 == 2) {
                triggerSynthNote([curNotes[i], curNotes[(i + 4) % curNotes.length]], [curDurs[i]], offset);
            } else if (Math.floor((seqCount - 3) / 8) % 3 == 1) {
                triggerSynthNote([curNotes[i], curNotes[(i + 2) % curNotes.length]], [curDurs[i]], offset);
            } else {
                triggerSynthNote([curNotes[i]], [curDurs[i]], offset);
            }
        }
    }
    for (let i = 0; i < 6; i++) {
        let tpose = (i % 3 == 2) ? (Math.floor(i / 3) == 1 ? (seqPos == 1 ? -21 : -20) : -17) : -24;
        if (seqPos > 1) {
            tpose += 12;
        }
        let note = Tone.Frequency(curNotes[0]).transpose(tpose).toNote();
        let dur = (i % 3 == 2) ? '4n' : '4n.';
        let offset = '+0:' + (3 * i - Math.floor(i / 3))
        bassSynth.triggerAttackRelease(note, dur, offset);
    }

    seqCount++;
    seqPos++;
    seqPos %= progs.length;
    window.setTimeout(stepSeq, 6400)
}

function MakeNewHeart(x = -1, y = -1) {
    var newHeart = {
        x: (x == -1 ? Math.random() * GAMESIZEX : x),
        y: (y == -1 ? Math.random() * GAMESIZEY : y),
        dx: (0.5 - Math.random()) * 5,
        dy: (0.5 - Math.random()) * 5,
        size: Math.random() * 10 + 5,
        color: GetRandomPurple(),
        op: 0,
        lop: 0,
    };
    return newHeart;
}

function Update() {
    hBarPos += hBarD;
    vBarPos += vBarD;
    if (hBarPos > srcCanvas.width) {
        hBarPos = srcCanvas.width;
        hBarD = -hBarD;
        hBarCol = GetRandomPurple();
    }
    if (vBarPos > srcCanvas.height) {
        vBarPos = srcCanvas.height;
        vBarD = -vBarD;
        vBarCol = GetRandomPurple();
    }
    if (hBarPos < 0) {
        hBarPos = 0;
        hBarD = -hBarD;
        hBarCol = GetRandomPurple();
    }
    if (vBarPos < 0) {
        vBarPos = 0;
        vBarD = -vBarD;
        vBarCol = GetRandomPurple();
    }

    let boomCounter = 0;
    for (let i = 0; i < hearts.length; i++) {
        if (hearts[i].x > (GAMESIZEX - (hearts[i].size / 2))) {
            hearts[i].x = GAMESIZEX - (hearts[i].size / 2);
            hearts[i].dx = -hearts[i].dx;
        }
        if (hearts[i].x < hearts[i].size / 2) {
            hearts[i].x = hearts[i].size / 2;
            hearts[i].dx = -hearts[i].dx;
        }
        if (hearts[i].y > (GAMESIZEY - (hearts[i].size))) {
            hearts[i].y = GAMESIZEY - (hearts[i].size);
            hearts[i].dy = -hearts[i].dy;
        }
        if (hearts[i].y < 0) {
            hearts[i].y = 0;
            hearts[i].dy = -hearts[i].dy;
        }
        hearts[i].x += hearts[i].dx;
        hearts[i].y += hearts[i].dy;
        hearts[i].size += 0.1;
        if (hearts[i].lop < 1) {
            hearts[i].lop += 0.01;
        }

        if (Math.abs(hearts[i].x - hBarPos) < hearts[i].size / 2) {
            hearts[i].op += 0.05;
        }
        if (Math.abs(hearts[i].y + (hearts[i].size / 2) - vBarPos) < hearts[i].size / 2) {
            hearts[i].op += 0.05;
        }
        hearts[i].op = Math.max(hearts[i].op - 0.01, 0);
        if (hearts[i].op > 1) {
            // Kaboom!
            launchConfetti(hearts[i].color, hearts[i].x, hearts[i].y + (hearts[i].size / 2));
            let fNotes = Shuffle(progs[(seqPos + 3) % 4].notes.map(n => Tone.Frequency(n).transpose(globalTranspose).toNote()));
            let voiceCount = 2;
            let voices = [];
            for (let j = 0; j < voiceCount; j++) {
                voices.push(Tone.Frequency(fNotes[j]).transpose(Math.random() > 0.5 ? 12 : 24).toNote());
            }
            fettiSynth.triggerAttackRelease(voices, '32n', '@8n');
            boomCounter++;
            hearts.splice(i, 1);
            if (Math.random() < 0.75) {
                hearts.push(MakeNewHeart());
            }
            i--;
        }
    }
}

function DrawGame() {
    if (drawBars) {
        // Draw the HBar and VBar
        ctx.fillStyle = hBarCol;
        ctx.fillRect(hBarPos, 0, 2, srcCanvas.height);
        ctx.fillStyle = vBarCol;
        ctx.fillRect(0, vBarPos, srcCanvas.width, 2);
    }

    for (let i = 0; i < hearts.length; i++) {
        DrawHeart(hearts[i].x, hearts[i].y, hearts[i].size, hearts[i].color, hearts[i].op, hearts[i].lop);
        // Game element drawing goes here
    }
}

//#endregion

//#region Initialization
function StartThings() {
    confettiCanvas.confetti = confettiCanvas.confetti || confetti.create(confettiCanvas);

    document.getElementById('start').style.display = 'none';
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    // Do initialization here
    InitGame();
    ResizeGame();
    DrawScreen();
};
//#endregion

//#region Handlers
function HandleMouse(e) {
    if (ModalUp) return; // Ignore the mouse if a Modal is currently displayed
    // mX and mY are Mouse X and Y in "Source Screen" coordinates
    let mX = (e.offsetX - screenOffsetX) / gameScale;
    let mY = (e.offsetY - screenOffsetY) / gameScale;

    if (firstClick) {
        firstClick = false;
    } else {
        if (canAddHeart) {
            canAddHeart = false;
            hearts.push(MakeNewHeart(mX, mY));
            window.setTimeout(() => { canAddHeart = true; }, 500);
        }
    }
    // Mouse handling here
}

function HandleKeys(e) {
    if (ModalUp) return; // Ignore the keyboard if a Modal is currently displayed

    if (e.key == 'l') {
        drawBars = !drawBars;
    }
    if (e.key == 'h' && canAddHeart) {
        canAddHeart = false;
        hearts.push(MakeNewHeart(mX, mY));
        window.setTimeout(() => { canAddHeart = true; }, 500);
    }
    // Key handling here
}
//#endregion

//#region Draw Utilities
function DrawScreen() {
    Update();

    // Clear the little canvas
    // ctx.globalAlpha = 0.1;
    // ctx.drawImage(srcCanvas, -1, 0);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
    // ctx.globalAlpha = 1;

    // Draw the game elements
    DrawGame();

    ctx.drawImage(confettiCanvas, 0, 0);

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    //dstctx.drawImage(confettiCanvas, 0, 0, confettiCanvas.width, confettiCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
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

function GetRandomPurple() {
    var r = 50 + Math.round(Math.random() * 250);
    var b = 50 + Math.round(Math.random() * 250);
    var g = 0;

    return RgbToHex(r, g, b);
}

function RgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function QuadLerp(t, x1, x2, x3) {
    return ((((1 - t) * (1 - t)) * x1) + (2 * (1 - t) * t * x2) + ((t * t) * x3));
}
//#endregion

//#region Drawing Helpers
function DrawHeart(x, y, size, color, op, lop) {
    let width = height = size;
    ctx.save();
    ctx.beginPath();
    var topCurveHeight = height * 0.3;
    ctx.moveTo(x + width / 2, y + topCurveHeight);

    //top right curve 
    ctx.quadraticCurveTo(
        x + width / 2, y,
        x + width / 4, y,
    );
    ctx.quadraticCurveTo(
        x, y,
        x, y + topCurveHeight,
    );
    // top left curve
    ctx.quadraticCurveTo(
        x, y,
        x - width / 4, y,
    );
    ctx.quadraticCurveTo(
        x - width / 2, y,
        x - width / 2, y + topCurveHeight,
    );


    // bottom left curve
    ctx.bezierCurveTo(
        x - width / 2, y + (height + topCurveHeight) / 2,
        x, y + (height + topCurveHeight) / 2,
        x, y + height
    );

    // bottom right curve
    ctx.bezierCurveTo(
        x, y + (height + topCurveHeight) / 2,
        x + width / 2, y + (height + topCurveHeight) / 2,
        x + width / 2, y + topCurveHeight
    );


    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.ceil(Math.log(size));
    ctx.fillStyle = color;
    ctx.globalAlpha = lop;
    ctx.stroke();
    ctx.globalAlpha = op * lop;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
}
//#endregion

function fire(particleRatio, x, y, opts) {
    confetti(Object.assign({}, { origin: { y: y, x: x } }, opts, {
        particleCount: Math.floor(200 * particleRatio),
    }));
}

function launchConfetti(col, sx, sy) {
    let x = (screenOffsetX / GAMESIZEX) + (sx / GAMESIZEX * gameScale);
    let y = (screenOffsetY / GAMESIZEY) + (sy / GAMESIZEY * gameScale);
    fire(0.25, x, y, {
        spread: 26,
        startVelocity: 55,
        colors: [col, GetRandomPurple()],
    });
    fire(0.2, x, y, {
        spread: 60,
        colors: [col, GetRandomPurple()],
    });
    fire(0.35, x, y, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: [col],
    });
    fire(0.1, x, y, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: [col, GetRandomPurple(), GetRandomPurple()],
    });
    fire(0.1, x, y, {
        spread: 120,
        startVelocity: 45,
        colors: [col, GetRandomPurple(), GetRandomPurple()],
    });
}

const chordSynth = new Tone.PolySynth(Tone.Synth);
chordSynth.set({
    oscillator: {
        type: "fatsawtooth4"
    },
    envelope: {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.5,
        release: 1
    },
    portamento: 0.2
});
chordSynth.volume.value = -24;
const filter = new Tone.Filter(250, "lowpass");
const chorus = new Tone.Chorus("1:0:0", 2.5, 1).toDestination();
const reverb = new Tone.Freeverb().toDestination();

// reverb.connect(filter);
chorus.connect(reverb);
chordSynth.connect(chorus);

//Add bass for the root note
const bassSynth = new Tone.Synth({
    oscillator: {
        type: "sine3"
    },
    envelope: {
        attack: 0.025,
        decay: 0.025,
        sustain: 0.25,
        release: 1
    }
}).toDestination();
bassSynth.volume.value = -12;

function triggerSynthNote(chord, duration, time) {
    const lowRootNote = Tone.Frequency(chord[0]).transpose(-12);
    chordSynth.triggerAttackRelease(chord, duration, time);
}

var fettiSynth = new Tone.PolySynth(Tone.AMSynth).toDestination();
fettiSynth.set({
    volume: -12,
    harmonicity: 2,
    oscillator: {
        type: "amsine2",
        modulationType: "sine",
        harmonicity: 1.01
    },
    envelope: {
        attack: 0.006,
        decay: 4,
        sustain: 0.04,
        release: 1.2
    },
    modulation: {
        volume: 13,
        type: "amsine2",
        modulationType: "sine",
        harmonicity: 12
    },
    modulationEnvelope: {
        attack: 0.006,
        decay: 0.2,
        sustain: 0.2,
        release: 0.4
    }
});