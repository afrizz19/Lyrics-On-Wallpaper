# LyricsApp

A real-time lyrics display application for Windows that fetches and displays synchronized lyrics for currently playing music. Built with Electron, TypeScript, and WebSocket technology.

## 🎵 Features

- **Real-time Lyrics Display** - Shows synchronized lyrics for currently playing music
- **WebNowPlaying Integration** - Seamless integration with WebNowPlaying extension
- **Spicetify Support** - Works with Spotify via Spicetify customization
- **Automatic Lyrics Fetching** - Fetches lyrics from configurable API endpoints
- **System Tray Integration** - Runs in the background with tray icon
- **Transparent Window** - Clean, minimal lyrics display interface
- **Position Synchronization** - Tracks song position and highlights current lyrics
- **Cross-Platform Ready** - Built with Electron for Windows compatibility

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Windows OS (for .exe build)
- WebNowPlaying extension (for music detection)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lyrics_ts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your API configuration:
   ```env
   LYRICS_API_BASE_URL=https://your-api-endpoint.com/lyrics
   LYRICS_API_KEY=your_api_key_here
   WEBSOCKET_PORT=8974
   HTTP_PORT=8090
   ```

4. **Run the application**
   ```bash
   npm start
   ```

5. **Setup Music Detection (Optional)**
   - Install WebNowPlaying extension for your browser or Spicetify
   - Configure WebNowPlaying to connect to `ws://localhost:8974`
   - Start playing music to see lyrics appear automatically

## 📖 Usage

### Development Mode

```bash
# Run with TypeScript (development)
npm start

# Run with compiled JavaScript
npm run build
npm run electron-start
```

### Production Build

```bash
# Build the application as Windows .exe
npm run dist
```

The executable will be created in the `dist/` folder.

## 🔧 Configuration

### WebSocket Server
- **Port:** 8974 (configurable via `WEBSOCKET_PORT`)
- **Purpose:** Receives track information from WebNowPlaying extension
- **Protocol:** WebSocket
- **Integration:** Compatible with WebNowPlaying for Spicetify and browser extensions

### HTTP Server
- **Port:** 8090 (configurable via `HTTP_PORT`)
- **Purpose:** Serves the lyrics display interface
- **Endpoints:**
  - `/` - Main lyrics display page
  - `/lyrics` - JSON API for lyrics data
  - `/position` - JSON API for current track position
  - `/fonts/*` - Font files

### Tray Icon
- **File:** `trayIcon.ico` (16x16, 32x32, 48x48 pixels recommended)
- **Actions:**
  - Left-click: Toggle window visibility
  - Right-click: Show context menu
  - Show: Display lyrics window
  - Quit: Close application completely

## 🏗️ Project Structure

```
lyrics_ts/
├── main.ts                 # Main Electron process
├── lyricsDisplay.html      # Lyrics display interface
├── trayIcon.ico           # System tray icon
├── fonts/                 # Custom fonts
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## 🔌 API Integration

### Lyrics API
- **Endpoint:** Configurable via `LYRICS_API_BASE_URL` environment variable
- **Parameters:** `artist` and `title`
- **API Key:** Optional, set via `LYRICS_API_KEY` environment variable
- **Response:** JSON with synchronized lyrics data

### Music Detection Integration

#### WebNowPlaying (Recommended)
This app is designed to work with **WebNowPlaying** extension for music detection:

1. **Install WebNowPlaying Extension:**
   - For **Spicetify**: Install the WebNowPlaying extension
   - For **Chrome/Firefox**: Install WebNowPlaying browser extension

2. **Configure WebNowPlaying:**
   - Set the WebSocket server to: `ws://localhost:8974`
   - The app automatically listens on port 8974 for track information

3. **Supported Music Platforms:**
   - Spotify (via Spicetify)
   - YouTube Music
   - SoundCloud
   - And many other web-based music players

#### WebSocket Messages
The app expects WebSocket messages in the following format:
- `TITLE:song_title`
- `ARTIST:artist_name`
- `POSITION:MM:SS`
- `DURATION:MM:SS`
- `ALBUM:album_name` (optional)
- `COVER:cover_url` (optional)

## 🛠️ Development

### Scripts

- `npm start` - Run in development mode with ts-node
- `npm run build` - Compile TypeScript to JavaScript
- `npm run electron-start` - Run compiled JavaScript with Electron
- `npm run dist` - Build Windows executable

### Dependencies

#### Production
- `node-fetch` - HTTP requests for lyrics API
- `ws` - WebSocket server functionality

#### Development
- `electron` - Desktop application framework
- `electron-builder` - Application packaging
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution
- `@types/node-fetch` - TypeScript definitions
- `@types/ws` - TypeScript definitions

## 🎨 Customization

### Styling
Modify `lyricsDisplay.html` to customize the lyrics display appearance.

### Fonts
Replace fonts in the `fonts/` directory and update the CSS in `lyricsDisplay.html`.

### Tray Icon
Replace `trayIcon.ico` with your custom icon (recommended sizes: 16x16, 32x32, 48x48 pixels).

## 🐛 Troubleshooting

### Common Issues

1. **"Loading lyrics..." stuck**
   - Check if the HTTP server is running on port 8090
   - Verify WebSocket connection on port 8974
   - Check browser console for errors
   - Ensure WebNowPlaying is configured to connect to `ws://localhost:8974`

2. **No music detection**
   - Install WebNowPlaying extension for your browser or Spicetify
   - Configure WebNowPlaying to connect to `ws://localhost:8974`
   - Check if music is playing on a supported platform
   - Verify WebSocket connection in browser DevTools

3. **Tray icon not showing**
   - Ensure `trayIcon.ico` exists in the project root
   - Check if the icon file is valid

4. **Build errors**
   - Ensure all dependencies are installed: `npm install`
   - Check TypeScript compilation: `npm run build`

### Debug Mode
Uncomment the following line in `main.ts` to open DevTools:
```typescript
win.webContents.openDevTools();
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions, please open an issue on the repository.

---

**Built with ❤️ using Electron and TypeScript** 