const ffi = require('ffi-napi');
const repbuffer = Buffer.alloc(16);

const user32 = new ffi.Library('user32', {
    'GetForegroundWindow': ['long', []],
    'GetWindowRect': ['bool', ['long', 'pointer']],
    'SetCursorPos': ['long', ['long', 'long']],
    'GetCursorPos': ['bool', ['pointer']]
});

// create rectangle from pointer
const pointerToRect = function(rectPointer) {
    const rect = {};
    rect.left = rectPointer.readInt16LE(0);
    rect.top = rectPointer.readInt16LE(4);
    rect.right = rectPointer.readInt16LE(8);
    rect.bottom = rectPointer.readInt16LE(12);
    return rect;
}

function getmousepos() {
    user32.GetCursorPos(repbuffer);
    let pos = {};
    pos.x = repbuffer[0] + (repbuffer[1] * 256);
    pos.y = repbuffer[4] + (repbuffer[5] * 256);
    return pos;
}

// obtain window dimension
const getWindowDimensions = function(handle) {
    const rectPointer = Buffer.alloc(16);
    const getWindowRect = user32.GetWindowRect(handle, rectPointer);
    return !getWindowRect ?
        null :
        pointerToRect(rectPointer);
}

let currentActiveWindow = 0;
let saveLastPosition = {};

setInterval(() => {
    try {
        const activeWindow = user32.GetForegroundWindow();
        const activeWindowDimensions = getWindowDimensions(activeWindow);
        if (!activeWindowDimensions) return;

        const activeWindowWidth = activeWindowDimensions.right - activeWindowDimensions.left;
        const activeWindowHeight = activeWindowDimensions.bottom - activeWindowDimensions.top;

        const mouse = getmousepos();

        if (!(mouse.x < activeWindowDimensions.right && mouse.x > activeWindowDimensions.left) &&
            activeWindow !== currentActiveWindow) {
            // if (saveLastPosition[activeWindow]) {
            //     user32.SetCursorPos(saveLastPosition[activeWindow].x, saveLastPosition[activeWindow].y);
            // } else {
            user32.SetCursorPos(activeWindowDimensions.right - (activeWindowWidth / 2), activeWindowDimensions.bottom - (activeWindowHeight / 2));
            // }
        }

        currentActiveWindow = activeWindow;
        // if (activeWindowDimensions.left <= mouse.x && activeWindowDimensions.right >= mouse.x) {
        saveLastPosition[currentActiveWindow] = mouse;
        // }

    } catch (error) {
        console.log(error);
    }
}, 100);