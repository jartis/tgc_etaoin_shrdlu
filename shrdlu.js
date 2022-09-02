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
var bgcolor = '#333333';
var screenOrientation = LANDSCAPE; // 0 Horiz, 1 Vert
var ModalUp = false;

var songCanvas = [];
var songCtx = [];
var bgCols = [];

var frame = 0;
var decidePoints = [];
var decideLastX = 0;
var decideLastY = 0;

var connectIns = 'A';
var connectAngle = 0;
var connectDelta = 11;
var connectX = 150;
var connectY = 350;

var believeDir = 0;

var centerStars = [];

var nameOpac = [
    0, 0, 0, 0, 0, 0, 0, 0, 0
];
var lastCell = 4;

//#region Game logic goes here

function InitGame() {
    connectIns = replaceAll(connectIns, rules);
    connectIns = replaceAll(connectIns, rules);
    connectIns = replaceAll(connectIns, rules);
    connectIns = replaceAll(connectIns, rules);
    connectIns = replaceAll(connectIns, rules);
    connectIns = 'R' + connectIns;

    for (let i = 0; i < 500; i++) {
        centerStars.push({
            x: 320,
            y: 180,
            dx: (16 / 9) * (0.5 - Math.random()),
            dy: 0.5 - Math.random(),
            col: RandomRangedRgb(100, 255)
        });
    }

    for (let i = 0; i < 9; i++) {
        bgCols[i] = RandomRangedRgb(0, 75);
        songCanvas[i] = document.createElement('canvas');
        songCanvas[i].width = 640;
        songCanvas[i].height = 360;
        songCtx[i] = songCanvas[i].getContext('2d');
        songCtx[i].fillStyle = bgCols[i];
        songCtx[i].fillRect(0, 0, 640, 360);
    }
    // bgcolor = getRandomRgb(0, 64);
}

function Update() {
    for (let i = 0; i < nameOpac.length; i++) {
        if (nameOpac[i] > 0) {
            nameOpac[i] -= 0.05;
        }
    }
    if (nameOpac[lastCell] < 1) {
        nameOpac[lastCell] += 0.15;
        if (nameOpac[lastCell] > 1) {
            nameOpac[lastCell] = 1;
        }
    }
    // Game logic here
}

function DrawPolygon(context, x, y, n, r, deg) {
    let rad = deg * Math.PI / 180;
    context.beginPath();
    context.lineWidth = 5;
    context.strokeStyle = '#555555';
    context.moveTo(x + r * Math.cos(rad), y + r * Math.sin(rad));
    for (let i = 1; i < n; i++) {
        context.lineTo(x + r * Math.cos(rad + (i * 2 * Math.PI / n)), y + r * Math.sin(rad + (i * 2 * Math.PI / n)));
    }
    context.closePath();
    context.stroke();
}

function DrawRemember() {
    songCtx[8].fillStyle = bgCols[8];
    songCtx[8].fillRect(0, 0, 640, 360);

    for (let i = 0; i < 32; i++) {
        let color = (frame + (i * 360 / 32)) % 360;
        songCtx[8].fillStyle = 'hsl(' + color + ', 50%, 33%)';
        let height = Math.sin(((frame / 2) + i) / 10) * 50 + 100;
        songCtx[8].fillRect((20 * i) + 1, (360 - height), 18, height);
    }

}

function DrawGame() {
    // Draw the "Align" canvas
    DrawAlign();

    // Draw the "Decide" canvas
    DrawDecide();

    // Draw the "Connect" canvas
    DrawConnect();

    // Draw the "Center" canvas
    DrawCenter();

    // Draw the "Remember" canvas
    DrawRemember();

    // Draw the "Believe" canvas
    DrawBelieve();

    // Draw the "Love" canvas
    DrawLove();

    // Draw the "Grow" canvas
    DrawGrow();

    // Draw the "Create" canvas
    DrawCreate();

    // Game element drawing goes here
    for (let i = 0; i < 9; i++) {
        let xPos = (i % 3) * 640;
        let yPos = Math.floor(i / 3) * 360;
        ctx.drawImage(songCanvas[i], xPos, yPos);
    }

    DrawNames();

    frame++;
}

//#endregion

//#region Initialization
window.onload = function() {
    window.addEventListener('resize', ResizeGame);
    window.addEventListener('click', HandleMouse);
    window.addEventListener('mousemove', HandleMouse);
    window.addEventListener('keydown', HandleKeys);

    // Do initialization here
    InitGame();
    ResizeGame();
    DrawScreen();
};

function DrawNames() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '100px Potra Light';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[0] + ')';
    ctx.fillText('Love', 320, 180);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[1] + ')';
    ctx.fillText('Align', 320 + 640, 180);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[2] + ')';
    ctx.fillText('Create', 320 + 1280, 180);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[3] + ')';
    ctx.fillText('Decide', 320, 180 + 360);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[5] + ')';
    ctx.fillText('Believe', 320 + 1280, 180 + 360);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[6] + ')';
    ctx.fillText('Connect', 320, 180 + 720);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[7] + ')';
    ctx.fillText('Grow', 320 + 640, 180 + 720);
    ctx.fillStyle = 'hsl(0, 100%, 100%, ' + nameOpac[8] + ')';
    ctx.fillText('Remember', 320 + 1280, 180 + 720);
}

function DrawCreate() {
    songCtx[2].fillStyle = bgCols[2];
    songCtx[2].fillRect(0, 0, 640, 360);
    if (frame % 99 == 0) {
        CreateGrid = MakeCreateGrid();
    }
    DrawGrid(songCtx[2]);
}

function DrawAlign() {
    songCtx[1].fillStyle = bgCols[1];
    songCtx[1].fillRect(0, 0, 640, 360);
    DrawPolygon(songCtx[1], 320, 180, 3, 170, frame);
    DrawPolygon(songCtx[1], 320, 180, 5, 170, -frame);
}

function makeGrowFlower() {
    return {
        x: 320,
        y: 180,
        radius: 1,
        numPetals: Math.floor(Math.random() * 8) + 4,
        col: RandomRangedRgb(100, 255),
        angle: 0,
        angleMod: (0.5 - Math.random()) * (Math.PI / 90),
    };
}

var growFlower = makeGrowFlower();

function DrawGrow() {

    DrawFlower(songCtx[7], growFlower.numPetals, growFlower.radius, growFlower.x, growFlower.y, growFlower.col, growFlower.angle);
    growFlower.radius++;
    if (growFlower.radius > 300) {
        songCtx[7].fillStyle = bgCols[7];
        songCtx[7].fillRect(0, 0, 640, 360);
        growFlower = makeGrowFlower();
    }
    songCtx[7].globalAlpha = 0.25;
    songCtx[7].fillStyle = bgCols[7];
    songCtx[7].fillRect(0, 0, 640, 360);
    songCtx[7].globalAlpha = 1;
    growFlower.angle += growFlower.angleMod;
}

var heartColor = GetRandomPurple();

function GetRandomPurple() {
    var r = 50 + Math.round(Math.random() * 250);
    var b = 50 + Math.round(Math.random() * 250);
    var g = 0;

    return RgbToHex(r, g, b);
}

function RgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function DrawLove() {
    songCtx[0].fillStyle = bgCols[0];
    songCtx[0].fillRect(0, 0, 640, 360);
    let size = Math.abs(Math.sin((frame / 50)) * 300);
    if (size < 3) { heartColor = GetRandomPurple(); }
    DrawHeart(songCtx[0], 320, 180 - (size / 2), size, heartColor);
}

function DrawConnect() {
    let didDraw = 0;

    songCtx[6].lineWidth = 3;
    songCtx[6].strokeStyle = 'hsl(' + ((frame * 3) % 360) + ', 75%, 50%)';
    songCtx[6].beginPath();


    while (!didDraw) {
        let command = connectIns.charAt(0);
        let dx = incX(connectAngle, connectDelta);
        let dy = incY(connectAngle, connectDelta);

        switch (command) {
            case 'F':
                songCtx[6].moveTo(connectX, connectY);
                connectX += dx;
                connectY += dy;
                songCtx[6].lineTo(connectX, connectY);
                songCtx[6].stroke();
                didDraw = true;
                break;
            case '+':
                connectAngle -= Math.PI / 2;
                break;
            case '-':
                connectAngle += Math.PI / 2;
                break;
            case 'R':
                connectAngle = 0;
                songCtx[6].moveTo(150, 350);
                connectX = 150;
                connectY = 350;
                didDraw = true;
                songCtx[6].globalCompositeOperation = 'source-over';
                songCtx[6].fillStyle = bgCols[6];
                songCtx[6].fillRect(0, 0, 640, 360);
                songCtx[6].globalCompositeOperation = 'lighter';
                break;
        }
        connectIns = connectIns.substring(1) + command;
    }
}

function DrawBelieve() {
    if (frame % 20 == 0) {
        believeDir = Math.floor(Math.random() * 3) - 1;
    }
    songCtx[5].drawImage(songCanvas[5], believeDir, -1);
    songCtx[5].fillStyle = 'hsl(' + (frame % 360) + ', 50%, 50%)';
    songCtx[5].fillRect(285, 359, 70, 1)
}

function DrawCenter() {
    songCtx[4].fillStyle = '#000000';
    songCtx[4].fillRect(0, 0, 640, 360);
    for (let i = 0; i < centerStars.length; i++) {
        let star = centerStars[i];
        songCtx[4].fillStyle = star.col;
        songCtx[4].fillRect(star.x, star.y, 1, 1);
        star.x += star.dx;
        star.y += star.dy;
        star.dx *= 1.01;
        star.dy *= 1.01;
        if (star.x < 0 || star.x > 640 || star.y < 0 || star.y > 360) {
            star.x = 320;
            star.y = 180;
            star.dx = (16 / 9) * (0.5 - Math.random());
            star.dy = 0.5 - Math.random();
            star.col = RandomRangedRgb(100, 255);
        }
    }

    songCtx[4].fillStyle = '#FFFFFF';
    songCtx[4].textAlign = 'center';
    songCtx[4].textBaseline = 'middle';
    songCtx[4].font = '48px Potra Light';
    songCtx[4].fillText('THE GOOD CHEMICALS', 320, 130);
    songCtx[4].font = '64px Potra Light';
    songCtx[4].fillText('ETAOIN   SHRDLU', 320, 230);
    songCtx[4].strokeStyle = '#AAAAAA';
    songCtx[4].lineWidth = 3;
    songCtx[4].strokeRect(0, 0, 640, 360);

    songCtx[4].strokeStyle = '#AAAAAA';
    songCtx[4].lineWidth = 3;
    songCtx[4].strokeRect(0, 0, 640, 360);
}

function DrawDecide() {
    songCtx[3].fillStyle = bgCols[3];
    songCtx[3].fillRect(0, 0, 640, 360);

    if (frame % 30 == 0) {
        if (decidePoints.length == 0 ||
            decideLastX < 0 ||
            decideLastY < 0 ||
            decideLastX > 639 ||
            decideLastY > 359) {
            decidePoints = [];
            decidePoints.push({
                x: 320,
                y: 180,
                c: 'hsl(' + (Math.floor(Math.random() * 360)) + ', 100%, 100%)',
            });
            decideLastX = 320;
            decideLastY = 180;
        } else {
            switch (Math.floor(Math.random() * 4)) {
                case 0:
                    decideLastX += 30;
                    break;
                case 1:
                    decideLastX -= 30;
                    break;
                case 2:
                    decideLastY += 30;
                    break;
                case 3:
                    decideLastY -= 30;
                    break;
            }
            decidePoints.push({
                x: decideLastX,
                y: decideLastY,
                c: 'hsl(' + (Math.floor(Math.random() * 360)) + ', 100%, 50%)',
            });
            if (decidePoints.length > 16) {
                decidePoints.shift();
            }
        }
    }

    songCtx[3].strokeStyle = '#AAAAAA';
    songCtx[3].lineWidth = 3;
    songCtx[3].beginPath();
    // Draw the lines
    if (decidePoints.length > 1) {
        songCtx[3].moveTo(decidePoints[0].x, decidePoints[0].y);
    }
    for (let i = 0; i < decidePoints.length; i++) {
        songCtx[3].lineTo(decidePoints[i].x, decidePoints[i].y);
    }
    songCtx[3].stroke();
    // Draw the points
    songCtx[3].fillStyle = '#000000';

    for (let i = 0; i < decidePoints.length; i++) {
        songCtx[3].strokeStyle = decidePoints[i].c;
        songCtx[3].beginPath();
        songCtx[3].arc(decidePoints[i].x, decidePoints[i].y, 7, 0, 2 * Math.PI);
        songCtx[3].fill();
        songCtx[3].stroke();
    }
}

//#endregion

//#region Handlers
function HandleMouse(e) {
    if (ModalUp) return; // Ignore the mouse if a Modal is currently displayed
    // mX and mY are Mouse X and Y in "Source Screen" coordinates
    let mX = (e.offsetX - screenOffsetX) / gameScale;
    let mY = (e.offsetY - screenOffsetY) / gameScale;
    if (mX < 0 || mY < 0) return; // Ignore if the mouse is outside the game area
    if (mX > 1919 || mY > 1079) return; // Ignore if the mouse is outside the game area

    let cY = Math.floor(mY / 360);
    let cX = Math.floor(mX / 640);

    if (e.type == 'mousemove') {
        lastCell = ((3 * cY) + cX);
    }
    if (e.type == 'click') {
        switch ((3 * cY) + cX) {
            case 0:
                window.location.href = "love";
                break;
            case 1:
                window.location.href = "align";
                break;
            case 2:
                window.location.href = "create";
                break;
            case 3:
                window.location.href = "decide";
                break;
            case 4:
                modalUp = true;
                MicroModal.show('info-modal', {
                    onClose: modal => { modalUp = false; },
                    disableFocus: true,
                });
                break;
            case 5:
                window.location.href = "believe";
                break;
            case 6:
                window.location.href = "connect";
                break;
            case 7:
                window.location.href = "grow";
                break;
            case 8:
                window.location.href = "remember";
                break;
        }
        // Mouse handling here
    }
}

function HandleKeys(e) {
    if (ModalUp) return; // Ignore the keyboard if a Modal is currently displayed

    // Key handling here
}
//#endregion

//#region Draw Utilities
function DrawScreen() {
    // Clear the little canvas
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);

    // Draw the game elements
    DrawGame();

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    Update();

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


const rules = {
    A: "-BF+AFA+FB-", // Rule 1
    B: "+AF-BFB-FA+" // Rule 2
};

function replaceAll(str, mapObj) {
    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");
    return str.replace(re, function(matched) {
        return mapObj[matched];
    });
}

function incX(angleRads, stepSize) {
    return Math.round(Math.cos(angleRads) * stepSize);
}

function incY(angleRads, stepSize) {
    return Math.round(Math.sin(angleRads) * stepSize) * -1;
}

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
    fctx.stroke();

    // draw yellow center
    fctx.beginPath();
    fctx.arc(x, y, radius / 6, 0, 2 * Math.PI, false);
    fctx.fillStyle = 'yellow';
    fctx.fill();
    fctx.stroke();
};

function DrawHeart(ctx, x, y, size, color) {
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
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.ceil(3 * Math.log(size));
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();
}

function DrawGrid(dctx) {
    for (var y = 0; y < 9; y++) {
        for (var x = 0; x < 16; x++) {
            let dX = (40 * x) + 5;
            let dY = (40 * y) + 5;
            let hue = (frame + (x * y)) % 360;
            if (CreateGrid[y][x]) {
                dctx.fillStyle = 'hsl(' + hue + ', 75%, 50%)';
            } else {
                dctx.fillStyle = 'hsl(' + (360 - hue) + ', 25%, 10%)';
            }
            RoundRect(dctx, dX, dY, 30, 30, 5, true, false);
        }
    }
}

var CreateGrid = MakeCreateGrid();

function MakeCreateGrid() {
    let cg = [];
    for (var y = 0; y < 9; y++) {
        cg[y] = [];
        for (var x = 0; x < 16; x++) {
            cg[y][x] = (Math.random() < 0.5);
        }
    }
    return cg;
}

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