"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let tray = null;
let win = null;
// Global variables for WebSocket server
const wss = new ws_1.WebSocketServer({ port: 8974 });
let currentPosition = '0';
let currentDuration = '0';
let lastPositionUpdate = Date.now();
let isSimulating = false;
let simulationInterval = null;
let lyricsServer = null;
// Global lyrics storage
let currentLyricsData = {
    title: '',
    artist: '',
    lrcContent: ''
};
const fetchLyricsFromApi = (artist, title) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `https://afrizz.my.id/lyrics?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
        const response = yield (0, node_fetch_1.default)(url);
        if (!response.ok) {
            console.error('API response not ok:', response.status);
            return null;
        }
        const data = yield response.json();
        if (!data.lyrics || data.lyrics.length === 0) {
            return null;
        }
        return data.lyrics;
    }
    catch (error) {
        console.error('Error fetching from API:', error);
        return null;
    }
});
// Function to fetch lyrics and return LRC content
const fetchLyricsAndWriteLRC = (title, artist) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!title || !artist) {
            console.log('Title or artist missing.');
            return '';
        }
        // Fetch lyrics from afrizz.my.id API
        const apiLyrics = yield fetchLyricsFromApi(artist, title);
        if (!apiLyrics || apiLyrics.length === 0) {
            console.error('No lyrics found from the API.');
            return '';
        }
        console.log('Lyrics fetched from API.');
        const lrcContent = apiLyrics
            .map(({ hundredths, minutes, seconds, text }) => {
            const totalSeconds = minutes * 60 + seconds + hundredths / 100;
            const min = Math.floor(totalSeconds / 60);
            const sec = (totalSeconds % 60).toFixed(2).padStart(5, '0');
            return `[${min.toString().padStart(2, '0')}:${sec}]${text}`;
        })
            .join('\n');
        console.log('LRC content generated and stored in memory');
        return lrcContent;
    }
    catch (error) {
        console.error('Error:', error);
        return '';
    }
});
// Function to update lyrics data in memory
const updateLyricsData = (title, artist) => __awaiter(void 0, void 0, void 0, function* () {
    currentLyricsData.title = title;
    currentLyricsData.artist = artist;
    // Fetch lyrics and update lrcContent
    const lrcContent = yield fetchLyricsAndWriteLRC(title, artist);
    currentLyricsData.lrcContent = lrcContent;
});
// Parse LRC content
const parseLRC = (lrcContent) => {
    const lines = lrcContent.split('\n');
    const lyricLines = [];
    const timeRegex = /\[(\d{2}):(\d{2}\.\d{2})\]/;
    for (const line of lines) {
        const match = line.match(timeRegex);
        if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            const timeInSeconds = minutes * 60 + seconds;
            const text = line.replace(timeRegex, '').trim();
            lyricLines.push({ time: timeInSeconds, text });
        }
    }
    return lyricLines;
};
// Start WebSocket server
function startWebSocketServer() {
    wss.on('connection', (ws) => {
        console.log('Client connected');
        let lastTrack = '';
        let lastArtist = '';
        let track_name = lastTrack;
        let artist_name = lastArtist;
        let position = currentPosition;
        let latestTrack = '';
        let latestArtist = '';
        let debounceTimer = null;
        let isUpdatingLyrics = false; // Flag to prevent duplicate API calls
        const normalizeArtistName = (name) => {
            return name.replace(/([a-z])([A-Z])/g, '$1 $2');
        };
        const sendTrackInfo = () => {
            const trackInfo = {
                track_name,
                artist_name,
                position,
            };
            ws.send(JSON.stringify(trackInfo));
        };
        const updateTrackInfo = () => {
            let cleanedTitle = track_name;
            // Only remove artist prefix if the title contains " - " and we have a separate artist
            // This prevents removing legitimate parts of song titles that contain " - "
            if (cleanedTitle.includes(' - ') && artist_name && artist_name.trim() !== '') {
                // Check if the part before " - " matches the artist name (case insensitive)
                const parts = cleanedTitle.split(' - ');
                const possibleArtist = parts[0].trim();
                const possibleTitle = parts.slice(1).join(' - ').trim();
                // Only remove if the first part looks like an artist name (matches our artist or is short)
                if (possibleArtist.toLowerCase() === artist_name.toLowerCase() || possibleArtist.length < 30) {
                    cleanedTitle = possibleTitle;
                }
            }
            cleanedTitle = cleanedTitle.replace(/\(official( music| lyric)? video\)/i, '').trim();
            cleanedTitle = cleanedTitle.replace(/^\s*-\s*/, '').replace(/\s*-\s*$/, '').trim();
            cleanedTitle = cleanedTitle.replace(/\s{2,}/g, ' ');
            const normalizedArtist = normalizeArtistName(artist_name);
            latestTrack = cleanedTitle;
            latestArtist = normalizedArtist;
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                if ((latestTrack !== lastTrack || latestArtist !== lastArtist) && !isUpdatingLyrics) {
                    console.log(`Fetching lyrics for: ${latestArtist} - ${latestTrack}`);
                    isUpdatingLyrics = true;
                    lastTrack = latestTrack;
                    lastArtist = latestArtist;
                    try {
                        // Update lyrics data in memory
                        yield updateLyricsData(latestTrack, latestArtist);
                    }
                    finally {
                        isUpdatingLyrics = false;
                    }
                }
            }), 300); // Increased debounce time to 300ms
        };
        sendTrackInfo();
        // Don't call updateTrackInfo() initially since we don't have track data yet
        ws.on('message', (message) => {
            const msg = message.toString();
            if (msg.startsWith('TITLE:')) {
                track_name = msg.substring('TITLE:'.length);
                console.log('Updated title:', track_name);
                sendTrackInfo();
                updateTrackInfo();
            }
            else if (msg.startsWith('ARTIST:')) {
                artist_name = msg.substring('ARTIST:'.length);
                console.log('Updated artist:', artist_name);
                sendTrackInfo();
                updateTrackInfo();
            }
            else if (msg.startsWith('POSITION:')) {
                position = msg.substring('POSITION:'.length);
                currentPosition = position;
                lastPositionUpdate = Date.now();
                // Restart simulation from the new position
                if (isSimulating) {
                    if (simulationInterval) {
                        clearInterval(simulationInterval);
                        simulationInterval = null;
                    }
                }
                // Start simulation from the new position if we have duration
                if (currentDuration !== '0') {
                    startPositionSimulation();
                }
                sendTrackInfo();
                // Do not write file or fetch lyrics on position update
            }
            else if (msg.startsWith('DURATION:')) {
                const duration = msg.substring('DURATION:'.length);
                currentDuration = duration;
                // Start simulation if we have both position and duration
                if (currentPosition !== '0' && currentDuration !== '0') {
                    startPositionSimulation();
                }
            }
            else if (msg.startsWith('ALBUM:')) {
                const album = msg.substring('ALBUM:'.length);
                // Store album if needed for future use
            }
            else if (msg.startsWith('COVER:')) {
                const cover = msg.substring('COVER:'.length);
                // Store cover URL if needed for future use
            }
        });
        ws.on('close', () => {
        });
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
        // Convert time string (MM:SS) to seconds
        const timeToSeconds = (timeStr) => {
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                return parseInt(parts[0]) * 60 + parseInt(parts[1]);
            }
            return 0;
        };
        // Convert seconds to time string (MM:SS)
        const secondsToTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        // Simulate position updates
        const startPositionSimulation = () => {
            if (currentDuration === '0')
                return;
            // Clear any existing simulation
            if (isSimulating && simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }
            isSimulating = true;
            const durationSeconds = timeToSeconds(currentDuration);
            let currentSeconds = timeToSeconds(currentPosition);
            simulationInterval = setInterval(() => {
                if (currentSeconds < durationSeconds) {
                    currentSeconds++;
                    currentPosition = secondsToTime(currentSeconds);
                    sendTrackInfo();
                }
                else {
                    isSimulating = false;
                    if (simulationInterval) {
                        clearInterval(simulationInterval);
                        simulationInterval = null;
                    }
                }
            }, 1000); // Update every second
        };
        // Check for position updates and start simulation if needed (fallback)
        const checkPositionUpdates = setInterval(() => {
            const timeSinceLastUpdate = Date.now() - lastPositionUpdate;
            if (timeSinceLastUpdate > 2000 && !isSimulating && currentDuration !== '0' && currentPosition !== '0') { // 2 seconds timeout as fallback
                startPositionSimulation();
            }
        }, 1000); // Check every second
        ws.on('close', () => {
            clearInterval(checkPositionUpdates);
            if (simulationInterval) {
                clearInterval(simulationInterval);
            }
        });
    });
    console.log('WebSocket server running on port 8974');
}
// Start HTTP server for lyrics display
function startHttpServer() {
    const PORT = 8090;
    lyricsServer = http_1.default.createServer((req, res) => {
        if (req.url === '/') {
            const filePath = path.join(__dirname, 'lyricsDisplay.html');
            fs_1.default.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error loading page');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            });
        }
        else if (req.url === '/lyrics') {
            if (currentLyricsData.lrcContent) {
                const lyrics = parseLRC(currentLyricsData.lrcContent);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(lyrics));
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([])); // Return an empty array instead of a string
            }
        }
        else if (req.url === '/position') {
            // Return the current position from the WebSocket client
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ position: currentPosition }));
        }
        else if (req.url && req.url.startsWith('/fonts/')) {
            const fontPath = path.join(__dirname, req.url);
            fs_1.default.readFile(fontPath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Font not found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'font/otf' });
                res.end(data);
            });
        }
        else {
            res.writeHead(404);
            res.end('Not found');
        }
    });
    lyricsServer.listen(PORT, () => {
        console.log(`Lyrics display server running at http://localhost:${PORT}`);
    });
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function createWindow() {
    return __awaiter(this, void 0, void 0, function* () {
        const { width: screenWidth, height: screenHeight } = electron_1.screen.getPrimaryDisplay().workAreaSize;
        const winWidth = 800;
        const winHeight = 600;
        win = new electron_1.BrowserWindow({
            width: winWidth,
            height: winHeight,
            x: -150,
            y: 875,
            transparent: true,
            frame: false,
            skipTaskbar: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        const maxRetries = 10;
        const retryDelay = 1000; // 1 second
        for (let i = 0; i < maxRetries; i++) {
            try {
                yield win.loadURL('http://localhost:8090');
                break;
            }
            catch (error) {
                console.log(`Failed to load URL, retrying in ${retryDelay}ms... (${i + 1}/${maxRetries})`);
                yield delay(retryDelay);
            }
        }
        win.on('close', (event) => {
            if (win) {
                event.preventDefault();
                win.hide();
            }
        });
        // win.webContents.openDevTools(); // Uncomment to open dev tools
    });
}
function createTray() {
    try {
        const trayIconPath = path.join(__dirname, 'trayIcon.ico');
        // Removed console.log for tray icon path as per user request
        const trayIcon = electron_1.nativeImage.createFromPath(trayIconPath);
        if (trayIcon.isEmpty()) {
            console.error('Tray icon image is empty or failed to load:', trayIconPath);
        }
        tray = new electron_1.Tray(trayIcon);
        const contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: 'Show',
                click: () => {
                    if (win) {
                        win.show();
                    }
                }
            },
            {
                label: 'Quit',
                click: () => {
                    // Close all windows
                    if (win) {
                        win.destroy();
                    }
                    // Close WebSocket server
                    if (wss) {
                        wss.close();
                    }
                    // Close HTTP server (we need to store the server reference)
                    if (lyricsServer) {
                        lyricsServer.close();
                    }
                    // Remove tray
                    if (tray) {
                        tray.destroy();
                    }
                    // Force quit the app
                    electron_1.app.exit(0);
                }
            }
        ]);
        tray.setToolTip('Lyrics Electron App');
        tray.setContextMenu(contextMenu);
        tray.on('click', () => {
            if (win) {
                if (win.isVisible()) {
                    win.hide();
                }
                else {
                    win.show();
                }
            }
        });
        tray.on('right-click', () => {
            if (tray) {
                tray.popUpContextMenu();
            }
        });
    }
    catch (error) {
        console.error('Failed to create tray:', error);
    }
}
electron_1.app.whenReady().then(() => {
    // Start the servers first
    startWebSocketServer();
    startHttpServer();
    // Then create the window and tray
    createWindow();
    createTray();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
