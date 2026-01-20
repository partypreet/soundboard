# Soundboard 🎵

An interactive 16-bar loop station with customizable sample packs, keyboard controls, and layer recording.

## Features

- 🎹 4x4 grid mapped to keyboard (Q-V keys)
- 🔴 Record up to 16 bars with unlimited layers
- ⏱️ Adjustable BPM (60-200)
- 🎨 Multiple sample packs (Drum Machine, Kanye's Runaway, Custom)
- 💾 Save and load custom sample packs
- ✏️ Drag-and-drop note editing
- 🎚️ Visual timeline with beat tracking

## Quick Start

1. Open `index.html` in a web browser
2. Select a sample pack from the dropdown
3. Click buttons or press Q-V keys to play sounds
4. Click "Record Layer" to start recording
5. Build complex beats by layering multiple recordings

## Deployment Options

### Option 1: GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files (index.html, sound-grid.jsx, uploads folder)
3. Go to Settings → Pages → Deploy from main branch
4. Access at: `https://yourusername.github.io/your-repo-name`

### Option 2: Netlify (Easiest)

1. Visit [netlify.com](https://netlify.com)
2. Drag the entire project folder to Netlify Drop
3. Get instant URL: `https://your-site.netlify.app`

### Option 3: Vercel

1. Visit [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically
4. Access at: `https://your-site.vercel.app`

## File Structure

```
soundboard/
├── index.html           # Main HTML file
├── sound-grid.jsx       # React component
├── uploads/             # Audio samples
│   ├── piano1.mp3
│   ├── piano2.mp3
│   └── ... (10 files total)
└── README.md           # This file
```

## Browser Compatibility

- Chrome/Edge (Recommended)
- Firefox
- Safari

Requires modern browser with Web Audio API support.

## Controls

### Keyboard
- **Q, W, E, R** - Top row sounds
- **A, S, D, F** - Middle row sounds
- **Z, X, C, V** - Bottom row sounds

### Recording
- **Record Layer** - Start/stop recording
- **Play Loop** - Play all recorded layers
- **Clear All Layers** - Delete all recordings

### Editing
- **Drag notes** - Move to different beats
- **Click notes** - Delete individual notes
- **Click layer trash** - Delete entire layer

## Custom Packs

1. Select "Custom" pack
2. Click edit icon to name your pack
3. Upload audio files (MP3/WAV) to any button
4. Click "Save Pack" to store configuration
5. Load saved packs anytime from the dropdown

## Credits

Built with React, Tailwind CSS, and the Web Audio API.

## License

Free to use and modify.
