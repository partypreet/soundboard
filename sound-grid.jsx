const SoundGrid = () => {
  const React = window.React;
  const { useState, useRef, useEffect } = React;
  const { Upload, Trash2, Volume2, Play, Square, Circle, Trash, Menu, X, Save, Edit2 } = window.lucide;
  
  // Keyboard layout mapping (4x4 grid)
  const keyLayout = [
    ['Q', 'W', 'E', 'R'],
    ['A', 'S', 'D', 'F'],
    ['Z', 'X', 'C', 'V']
  ];

  const BARS = 16;
  const BEATS_PER_BAR = 4;
  const TOTAL_BEATS = BARS * BEATS_PER_BAR;

  // Preset drum samples (using Web Audio API generated sounds)
  const presetPacks = {
    'Drum Machine': {
      'Q': { name: 'Kick', type: 'kick' },
      'W': { name: 'Snare', type: 'snare' },
      'E': { name: 'Hi-Hat Closed', type: 'hihat' },
      'R': { name: 'Hi-Hat Open', type: 'hihat-open' },
      'A': { name: 'Tom Low', type: 'tom-low' },
      'S': { name: 'Tom Mid', type: 'tom-mid' },
      'D': { name: 'Tom High', type: 'tom-high' },
      'F': { name: 'Clap', type: 'clap' },
      'Z': { name: 'Cymbal', type: 'cymbal' },
      'X': { name: 'Rim', type: 'rim' },
      'C': { name: 'Cowbell', type: 'cowbell' },
      'V': { name: 'Perc', type: 'perc' }
    },
    "Kanye's Runaway": {
      'Q': { name: 'Piano 1', type: 'file', path: './uploads/piano1.mp3' },
      'W': { name: 'Piano 2', type: 'file', path: './uploads/piano2.mp3' },
      'E': { name: 'Piano 3', type: 'file', path: './uploads/piano3.mp3' },
      'R': { name: 'Piano 4', type: 'file', path: './uploads/piano4.mp3' },
      'A': { name: 'Piano 5', type: 'file', path: './uploads/piano5.mp3' },
      'S': { name: 'Piano 6', type: 'file', path: './uploads/piano6.mp3' },
      'D': { name: 'Piano 7', type: 'file', path: './uploads/piano7.mp3' },
      'F': { name: 'Piano 8', type: 'file', path: './uploads/piano8.mp3' },
      'Z': { name: 'Beat', type: 'file', path: './uploads/Beat.mp3' },
      'X': { name: 'Look At Cha', type: 'file', path: './uploads/LookAtCha.mp3' },
      'C': { name: 'Upload', type: 'custom', file: null },
      'V': { name: 'Upload', type: 'custom', file: null }
    },
    'Custom': {}
  };

  const [currentPack, setCurrentPack] = useState('Drum Machine');
  const [sounds, setSounds] = useState({});
  const [activeKeys, setActiveKeys] = useState(new Set());
  const [bpm, setBpm] = useState(120);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [recordedLayers, setRecordedLayers] = useState([]);
  const [currentLayer, setCurrentLayer] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [runawaySamples, setRunawaySamples] = useState({});
  const [customPackName, setCustomPackName] = useState('Custom');
  const [savedPacks, setSavedPacks] = useState({});
  const [isEditingPackName, setIsEditingPackName] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const audioContextRef = useRef(null);
  const fileInputRefs = useRef({});
  const playbackIntervalRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  // Initialize Audio Context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load Kanye's Runaway samples when pack is selected
  useEffect(() => {
    const loadRunawaySamples = async () => {
      if (currentPack !== "Kanye's Runaway") return;
      
      const pack = presetPacks["Kanye's Runaway"];
      const loadedSamples = {};
      
      console.log("Loading Kanye's Runaway samples...");
      
      for (const [key, sample] of Object.entries(pack)) {
        if (sample.type === 'file' && sample.path) {
          try {
            console.log(`Loading ${sample.name} from ${sample.path}`);
            const response = await fetch(sample.path);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            console.log(`Fetched ${sample.name}, size: ${arrayBuffer.byteLength} bytes`);
            
            // Decode audio data with promise-based approach for better compatibility
            const audioBuffer = await new Promise((resolve, reject) => {
              audioContextRef.current.decodeAudioData(
                arrayBuffer,
                (buffer) => resolve(buffer),
                (error) => reject(error)
              );
            });
            
            loadedSamples[key] = {
              name: sample.name,
              buffer: audioBuffer
            };
            console.log(`✓ Loaded ${sample.name} - Duration: ${audioBuffer.duration}s`);
          } catch (error) {
            console.error(`Failed to load ${sample.name}:`, error);
          }
        }
      }
      
      console.log("Successfully loaded samples:", Object.keys(loadedSamples));
      setRunawaySamples(loadedSamples);
    };
    
    loadRunawaySamples();
  }, [currentPack]);

  // Generate drum sounds using Web Audio API
  const generateDrumSound = (type) => {
    const ctx = audioContextRef.current;
    const currentTime = ctx.currentTime;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch(type) {
      case 'kick':
        oscillator.frequency.setValueAtTime(150, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        gainNode.gain.setValueAtTime(1, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
        break;
      
      case 'snare':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(200, currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, currentTime);
        gainNode.gain.setValueAtTime(0.7, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        
        // Add noise
        const bufferSize = ctx.sampleRate * 0.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noise.start(currentTime);
        noise.stop(currentTime + 0.2);
        break;
      
      case 'hihat':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(250, currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, currentTime);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
        break;
      
      case 'hihat-open':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(250, currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, currentTime);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        break;
      
      case 'tom-low':
        oscillator.frequency.setValueAtTime(90, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.4);
        break;
      
      case 'tom-mid':
        oscillator.frequency.setValueAtTime(130, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        break;
      
      case 'tom-high':
        oscillator.frequency.setValueAtTime(180, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, currentTime + 0.25);
        gainNode.gain.setValueAtTime(0.8, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.25);
        break;
      
      case 'clap':
        const claps = 3;
        for (let i = 0; i < claps; i++) {
          const clapTime = currentTime + (i * 0.03);
          const clapBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
          const clapData = clapBuffer.getChannelData(0);
          for (let j = 0; j < clapData.length; j++) {
            clapData[j] = Math.random() * 2 - 1;
          }
          const clapSource = ctx.createBufferSource();
          clapSource.buffer = clapBuffer;
          const clapGain = ctx.createGain();
          clapGain.gain.setValueAtTime(0.4, clapTime);
          clapGain.gain.exponentialRampToValueAtTime(0.01, clapTime + 0.05);
          clapSource.connect(clapGain);
          clapGain.connect(ctx.destination);
          clapSource.start(clapTime);
        }
        oscillator.stop(currentTime);
        return;
      
      case 'cymbal':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, currentTime);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, currentTime);
        gainNode.gain.setValueAtTime(0.4, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.8);
        break;
      
      case 'rim':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, currentTime);
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
        break;
      
      case 'cowbell':
        oscillator.frequency.setValueAtTime(540, currentTime);
        oscillator.type = 'square';
        gainNode.gain.setValueAtTime(0.5, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        break;
      
      case 'perc':
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.4, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);
        break;
      
      default:
        oscillator.frequency.value = 440;
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
    }

    oscillator.start(currentTime);
    oscillator.stop(currentTime + 1);
  };

  // Play custom uploaded sound
  const playCustomSound = (audioBuffer) => {
    if (!audioBuffer) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
  };

  // Handle sound playback
  const playSound = (key, skipRecording = false) => {
    const sound = sounds[key];
    
    console.log(`Playing key: ${key}, Pack: ${currentPack}`);
    
    if (currentPack === 'Drum Machine' && presetPacks['Drum Machine'][key]) {
      generateDrumSound(presetPacks['Drum Machine'][key].type);
    } else if (currentPack === "Kanye's Runaway" && runawaySamples[key]) {
      console.log(`Playing Runaway sample for ${key}:`, runawaySamples[key]);
      playCustomSound(runawaySamples[key].buffer);
    } else if (sound && sound.buffer) {
      playCustomSound(sound.buffer);
    } else {
      console.log(`No sound found for key ${key}`);
    }

    // Record the note if recording is active
    if (isRecording && !skipRecording && recordingStartTimeRef.current) {
      const elapsedTime = Date.now() - recordingStartTimeRef.current;
      const beatDuration = (60 / bpm) * 1000; // milliseconds per beat
      const beat = Math.floor(elapsedTime / beatDuration) % TOTAL_BEATS;
      
      setCurrentLayer(prev => [...prev, { key, beat }]);
    }

    // Visual feedback
    setActiveKeys(prev => new Set(prev).add(key));
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 150);
  };

  // Handle file upload
  const handleFileUpload = async (key, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      console.log(`Uploading ${file.name} (${file.type})`);
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data with promise-based approach for MP3/WAV compatibility
      const audioBuffer = await new Promise((resolve, reject) => {
        audioContextRef.current.decodeAudioData(
          arrayBuffer,
          (buffer) => resolve(buffer),
          (error) => reject(error)
        );
      });

      if (currentPack === "Kanye's Runaway") {
        setRunawaySamples(prev => ({
          ...prev,
          [key]: {
            name: file.name,
            buffer: audioBuffer
          }
        }));
      } else {
        setSounds(prev => ({
          ...prev,
          [key]: {
            name: file.name,
            buffer: audioBuffer
          }
        }));
      }
      
      console.log(`✓ Successfully uploaded ${file.name}`);
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      alert(`Failed to load audio file: ${file.name}. Please make sure it's a valid audio file (MP3, WAV, etc.)`);
    }
  };

  // Clear sound from button
  const clearSound = (key) => {
    if (currentPack === "Kanye's Runaway") {
      setRunawaySamples(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setSounds(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Start/Stop Recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and save the layer
      if (currentLayer.length > 0) {
        setRecordedLayers(prev => [...prev, currentLayer]);
        setCurrentLayer([]);
      }
      setIsRecording(false);
      recordingStartTimeRef.current = null;
    } else {
      // Start recording
      setCurrentLayer([]);
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();
      setCurrentBeat(0);
      
      // Start the beat counter
      if (!isPlaying) {
        startPlayback(true);
      }
    }
  };

  // Start/Stop Playback
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback(false);
    }
  };

  const startPlayback = (recordingOnly = false) => {
    setIsPlaying(true);
    setCurrentBeat(0);
    
    const beatDuration = (60 / bpm) * 1000; // milliseconds per beat
    let beat = 0;
    
    playbackIntervalRef.current = setInterval(() => {
      setCurrentBeat(beat);
      
      // Play all recorded layers
      if (!recordingOnly) {
        recordedLayers.forEach(layer => {
          layer.forEach(note => {
            if (note.beat === beat) {
              playSound(note.key, true);
            }
          });
        });
      }
      
      beat = (beat + 1) % TOTAL_BEATS;
      
      // If we've completed the loop and we're only recording, keep going
      if (beat === 0 && recordingOnly && !isRecording) {
        stopPlayback();
      }
    }, beatDuration);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setCurrentBeat(0);
  };

  // Clear all layers
  const clearAllLayers = () => {
    setRecordedLayers([]);
    setCurrentLayer([]);
    stopPlayback();
    setIsRecording(false);
  };

  // Delete a specific layer
  const deleteLayer = (index) => {
    setRecordedLayers(prev => prev.filter((_, i) => i !== index));
  };

  // Move a note to a different beat
  const moveNote = (layerIndex, noteIndex, newBeat) => {
    setRecordedLayers(prev => {
      const newLayers = [...prev];
      const layer = [...newLayers[layerIndex]];
      layer[noteIndex] = { ...layer[noteIndex], beat: newBeat };
      newLayers[layerIndex] = layer;
      return newLayers;
    });
  };

  // Delete a specific note from a layer
  const deleteNote = (layerIndex, noteIndex) => {
    setRecordedLayers(prev => {
      const newLayers = [...prev];
      newLayers[layerIndex] = newLayers[layerIndex].filter((_, i) => i !== noteIndex);
      return newLayers;
    });
  };

  // Save current custom pack
  const saveCustomPack = async () => {
    if (!customPackName || customPackName === 'Custom') {
      alert('Please give your pack a unique name before saving!');
      return;
    }

    // Convert audio buffers to base64 for storage
    const packData = {};
    for (const [key, sound] of Object.entries(sounds)) {
      if (sound && sound.buffer) {
        // Store metadata only - we'll need to re-upload files when loading
        packData[key] = {
          name: sound.name,
          // We can't easily serialize AudioBuffer, so we'll store metadata
          // and require re-upload or use IndexedDB for actual audio data
        };
      }
    }

    const newPack = {
      name: customPackName,
      sounds: packData,
      metadata: sounds
    };

    const updatedPacks = {
      ...savedPacks,
      [customPackName]: newPack
    };

    setSavedPacks(updatedPacks);
    
    // Save to localStorage (metadata only)
    try {
      localStorage.setItem('soundGridCustomPacks', JSON.stringify(
        Object.keys(updatedPacks).reduce((acc, key) => {
          acc[key] = { name: updatedPacks[key].name, sounds: updatedPacks[key].sounds };
          return acc;
        }, {})
      ));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    setShowSaveDialog(false);
    alert(`Pack "${customPackName}" saved successfully!`);
  };

  // Load saved packs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('soundGridCustomPacks');
      if (saved) {
        const packs = JSON.parse(saved);
        setSavedPacks(packs);
      }
    } catch (e) {
      console.error('Failed to load saved packs:', e);
    }
  }, []);

  // Load a saved pack
  const loadSavedPack = (packName) => {
    const pack = savedPacks[packName];
    if (pack) {
      setCustomPackName(packName);
      // Note: Audio buffers need to be re-uploaded as they can't be serialized
      setSounds({});
      alert(`Loaded pack "${packName}". Please re-upload the audio files for each slot.`);
    }
  };

  // Delete a saved pack
  const deleteSavedPack = (packName) => {
    if (confirm(`Delete pack "${packName}"?`)) {
      const updatedPacks = { ...savedPacks };
      delete updatedPacks[packName];
      setSavedPacks(updatedPacks);
      
      try {
        localStorage.setItem('soundGridCustomPacks', JSON.stringify(updatedPacks));
      } catch (e) {
        console.error('Failed to update localStorage:', e);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger sounds if user is editing pack name or typing in BPM field
      if (isEditingPackName || e.target.tagName === 'INPUT') {
        return;
      }
      
      const key = e.key.toUpperCase();
      if (keyLayout.flat().includes(key) && !activeKeys.has(key)) {
        e.preventDefault();
        playSound(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sounds, currentPack, activeKeys, isEditingPackName]);

  // Get button label
  const getButtonLabel = (key) => {
    if (currentPack === 'Drum Machine' && presetPacks['Drum Machine'][key]) {
      return presetPacks['Drum Machine'][key].name;
    }
    if (currentPack === "Kanye's Runaway") {
      // Check if user uploaded a custom sample for this key
      if (runawaySamples[key]) {
        return runawaySamples[key].name.replace(/\.[^/.]+$/, '').substring(0, 12);
      }
      // Show preset name from pack definition
      if (presetPacks["Kanye's Runaway"][key]) {
        return presetPacks["Kanye's Runaway"][key].name;
      }
      return 'Upload';
    }
    if (sounds[key]) {
      return sounds[key].name.replace(/\.[^/.]+$/, '').substring(0, 12);
    }
    return 'Empty';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative text-center mb-6">
          {/* Menu Burger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="absolute left-0 top-0 p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <h1 className="text-4xl font-bold text-white mb-2">Soundboard</h1>
          <div className="flex items-center justify-center gap-4">
            <p className="text-gray-300">Click buttons or use your keyboard (Q-V)</p>
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <label className="text-white font-semibold text-sm">BPM:</label>
              <input
                type="number"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 120;
                  setBpm(Math.min(Math.max(value, 60), 200));
                }}
                disabled={isPlaying || isRecording}
                className="w-20 bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Menu Dropdown */}
        {isMenuOpen && (
          <div className="mb-6 bg-gray-800 rounded-lg p-6 shadow-2xl">
            <h3 className="text-white font-semibold mb-3">How to Use:</h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• <strong>Keyboard:</strong> Press Q, W, E, R, A, S, D, F, Z, X, C, or V to trigger sounds</li>
              <li>• <strong>Mouse:</strong> Click any button to play its sound</li>
              <li>• <strong>Set BPM:</strong> Enter tempo in header (60-200)</li>
              <li>• <strong>Sample Packs:</strong> Choose between Drum Machine (preset sounds) or Custom (upload your own)</li>
              <li>• <strong>Upload Sounds:</strong> In Custom mode, hover over buttons to upload or clear audio files</li>
              <li>• <strong>Record Layer:</strong> Click "Record Layer" button and play sounds - they'll be captured with precise timing</li>
              <li>• <strong>Edit Notes:</strong> Drag notes left/right in the timeline to move them to different beats</li>
              <li>• <strong>Delete Notes:</strong> Click any note once to remove it from the layer</li>
              <li>• <strong>Play Loop:</strong> Listen to all your recorded layers looping together over 16 bars</li>
              <li>• <strong>Layer Building:</strong> Record multiple layers to build complex beats and compositions</li>
              <li>• <strong>Save Packs:</strong> Name and save your custom sample packs to reuse them later</li>
            </ul>
          </div>
        )}

        {/* Save Pack Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-white font-semibold text-lg mb-4">Save Custom Pack</h3>
              <p className="text-gray-300 text-sm mb-4">
                Save "{customPackName}" with {Object.keys(sounds).length} uploaded sound{Object.keys(sounds).length !== 1 ? 's' : ''}?
              </p>
              <p className="text-yellow-400 text-xs mb-4">
                Note: You'll need to keep the audio files. The pack saves which slots have sounds, but you'll need to re-upload the files when loading the pack.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomPack}
                  className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Pack
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loop Visualization - Horizontal at Top */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">16-Bar Loop</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-300">
                Bar: {Math.floor(currentBeat / BEATS_PER_BAR) + 1}/16 | Beat: {(currentBeat % BEATS_PER_BAR) + 1}/4
              </div>
            </div>
          </div>
          
          {/* Timeline with bar numbers */}
          <div className="mb-3">
            <div className="flex">
              {Array.from({ length: 16 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-xs text-gray-400 font-semibold pb-1">
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-purple-500 transition-all duration-100"
                style={{ width: `${((currentBeat + 1) / TOTAL_BEATS) * 100}%` }}
              />
            </div>
          </div>

          {/* Layers - Stacked Horizontally */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {isRecording && (
              <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-red-300 font-semibold text-sm flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-current animate-pulse" />
                    Recording... ({currentLayer.length} notes)
                  </span>
                </div>
                <LayerVisualization 
                  notes={currentLayer} 
                  currentBeat={currentBeat}
                  onMoveNote={() => {}}
                  onDeleteNote={() => {}}
                  isEditable={false}
                />
              </div>
            )}

            {recordedLayers.map((layer, layerIndex) => (
              <div key={layerIndex} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">
                    Layer {recordedLayers.length - layerIndex} ({layer.length} notes)
                  </span>
                  <button
                    onClick={() => deleteLayer(layerIndex)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-900/30 rounded"
                    title="Delete layer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <LayerVisualization 
                  notes={layer} 
                  currentBeat={isPlaying ? currentBeat : -1}
                  onMoveNote={(noteIndex, newBeat) => moveNote(layerIndex, noteIndex, newBeat)}
                  onDeleteNote={(noteIndex) => deleteNote(layerIndex, noteIndex)}
                  isEditable={true}
                />
              </div>
            ))}

            {recordedLayers.length === 0 && !isRecording && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No layers recorded yet.</p>
                <p className="text-xs mt-1">Click "Record Layer" to start!</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Controls and Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            {/* Pack Selector */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
              <label className="block text-white font-semibold mb-2">Sample Pack</label>
              <select
                value={currentPack}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.startsWith('saved:')) {
                    const packName = value.replace('saved:', '');
                    loadSavedPack(packName);
                    setCurrentPack('Custom');
                  } else {
                    setCurrentPack(value);
                  }
                }}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Drum Machine">Drum Machine</option>
                <option value="Kanye's Runaway">Kanye's Runaway</option>
                <option value="Custom">Custom</option>
                {Object.keys(savedPacks).length > 0 && (
                  <optgroup label="Saved Packs">
                    {Object.keys(savedPacks).map(packName => (
                      <option key={packName} value={`saved:${packName}`}>
                        {packName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Custom Pack Name Editor */}
              {currentPack === 'Custom' && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {isEditingPackName ? (
                      <>
                        <input
                          type="text"
                          value={customPackName}
                          onChange={(e) => setCustomPackName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setIsEditingPackName(false);
                              e.target.blur();
                            }
                            if (e.key === 'Escape') {
                              setIsEditingPackName(false);
                              e.target.blur();
                            }
                            // Stop event propagation to prevent sound triggers
                            e.stopPropagation();
                          }}
                          onBlur={() => setIsEditingPackName(false)}
                          className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Pack name..."
                          autoFocus
                        />
                        <button
                          onClick={() => setIsEditingPackName(false)}
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-white font-semibold">
                          {customPackName}
                        </div>
                        <button
                          onClick={() => setIsEditingPackName(true)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                          title="Edit pack name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => setShowSaveDialog(true)}
                    disabled={Object.keys(sounds).length === 0}
                    className="w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    Save Pack
                  </button>
                </div>
              )}

              {/* Saved Packs Management */}
              {currentPack === 'Custom' && Object.keys(savedPacks).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="text-white text-sm font-semibold mb-2">Saved Packs:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.keys(savedPacks).map(packName => (
                      <div key={packName} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
                        <span className="text-white text-sm">{packName}</span>
                        <button
                          onClick={() => deleteSavedPack(packName)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete pack"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="bg-gray-800 rounded-lg p-6 shadow-2xl">
              <h3 className="text-white font-semibold mb-4">Loop Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={togglePlayback}
                  disabled={isRecording}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isPlaying
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-5 h-5" />
                      Stop Playback
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Play Loop
                    </>
                  )}
                </button>

                <button
                  onClick={toggleRecording}
                  className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <Circle className={`w-5 h-5 ${isRecording ? 'fill-current' : ''}`} />
                  {isRecording ? 'Stop Recording' : 'Record Layer'}
                </button>

                <button
                  onClick={clearAllLayers}
                  disabled={recordedLayers.length === 0 && currentLayer.length === 0}
                  className="w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash className="w-5 h-5" />
                  Clear All Layers
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-300">
                  <div className="mb-2 font-semibold">Layers: {recordedLayers.length}</div>
                  <div className="text-xs text-gray-400">
                    Drag notes to move them. Click notes to delete.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sound Grid (spans 3 columns) */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
              {keyLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 mb-4 last:mb-0">
                  {row.map((key) => (
                    <div
                      key={key}
                      className="flex-1 relative group"
                    >
                      {/* Main Button */}
                      <button
                        onClick={() => playSound(key)}
                        className={`
                          w-full aspect-square rounded-lg font-bold text-lg
                          transition-all duration-150 transform
                          ${activeKeys.has(key)
                            ? 'bg-purple-500 scale-95 shadow-lg shadow-purple-500/50'
                            : 'bg-gradient-to-br from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500'
                          }
                          border-2 border-gray-500 hover:border-purple-400
                          shadow-xl relative overflow-hidden
                        `}
                      >
                        {/* Key Label */}
                        <div className="absolute top-2 left-2 text-xs font-mono text-gray-300 bg-gray-900/50 px-2 py-1 rounded">
                          {key}
                        </div>
                        
                        {/* Sound Name */}
                        <div className="flex flex-col items-center justify-center h-full px-2">
                          <Volume2 className={`w-6 h-6 mb-1 ${activeKeys.has(key) ? 'text-white' : 'text-gray-400'}`} />
                          <span className="text-sm text-white text-center leading-tight">
                            {getButtonLabel(key)}
                          </span>
                        </div>
                      </button>

                      {/* Upload/Clear Controls */}
                      {(currentPack === 'Custom' || 
                        (currentPack === "Kanye's Runaway" && 
                         presetPacks["Kanye's Runaway"][key]?.type === 'custom')) && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => fileInputRefs.current[key]?.click()}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 shadow-lg"
                            title="Upload sound"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          {((currentPack === 'Custom' && sounds[key]) || 
                            (currentPack === "Kanye's Runaway" && runawaySamples[key] && 
                             presetPacks["Kanye's Runaway"][key]?.type === 'custom')) && (
                            <button
                              onClick={() => clearSound(key)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg"
                              title="Clear sound"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Hidden File Input */}
                      <input
                        ref={el => fileInputRefs.current[key] = el}
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/*"
                        onChange={(e) => handleFileUpload(key, e)}
                        className="hidden"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Layer Visualization Component with Drag & Drop
const LayerVisualization = ({ notes, currentBeat, onMoveNote, onDeleteNote, isEditable }) => {
  const BARS = 16;
  const BEATS_PER_BAR = 4;
  const TOTAL_BEATS = BARS * BEATS_PER_BAR;
  const [draggedNote, setDraggedNote] = useState(null);

  // Group notes by beat
  const notesByBeat = notes.reduce((acc, note, index) => {
    if (!acc[note.beat]) acc[note.beat] = [];
    acc[note.beat].push({ ...note, index });
    return acc;
  }, {});

  const handleDragStart = (e, noteIndex, beat) => {
    if (!isEditable) return;
    setDraggedNote({ noteIndex, beat });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, newBeat) => {
    if (!isEditable || !draggedNote) return;
    e.preventDefault();
    
    if (draggedNote.beat !== newBeat) {
      onMoveNote(draggedNote.noteIndex, newBeat);
    }
    setDraggedNote(null);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleNoteClick = (e, noteIndex) => {
    if (!isEditable) return;
    e.stopPropagation();
    onDeleteNote(noteIndex);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-64 gap-px">
        {Array.from({ length: TOTAL_BEATS }, (_, beatIndex) => {
          const notesAtBeat = notesByBeat[beatIndex] || [];
          const isCurrent = currentBeat === beatIndex;
          const isBarStart = beatIndex % BEATS_PER_BAR === 0;
          const isDragTarget = draggedNote && draggedNote.beat !== beatIndex;

          return (
            <div
              key={beatIndex}
              className={`
                h-12 rounded-sm transition-all relative
                ${isBarStart ? 'border-l-2 border-gray-600' : ''}
                ${isCurrent ? 'bg-purple-500/30 ring-1 ring-purple-400' : 'bg-gray-600'}
                ${isDragTarget && isEditable ? 'hover:bg-gray-500' : ''}
              `}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, beatIndex)}
            >
              {/* Notes at this beat */}
              {notesAtBeat.length > 0 && (
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-0.5 p-0.5">
                  {notesAtBeat.map((note) => (
                    <div
                      key={note.index}
                      draggable={isEditable}
                      onDragStart={(e) => handleDragStart(e, note.index, beatIndex)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => handleNoteClick(e, note.index)}
                      className={`
                        w-full flex-1 rounded-sm flex items-center justify-center text-xs font-bold
                        ${isEditable ? 'cursor-move hover:ring-2 hover:ring-white' : 'cursor-default'}
                        ${isCurrent ? 'bg-purple-400' : 'bg-blue-500'}
                        text-white shadow-md
                        transition-all
                      `}
                      title={isEditable ? `${note.key} - Drag to move, Click to delete` : note.key}
                    >
                      {note.key}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Bar markers */}
      <div className="flex mt-1">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} className="flex-1 text-center">
            {(i % 4 === 0) && (
              <div className="text-xs text-gray-500 font-semibold">|</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
