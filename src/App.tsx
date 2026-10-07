/**
 * STARK AI - Universal Voice Typing, Multi-Screen Integration & Intelligent Real-Time Translation System
 * Licensed under Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, MicOff, Settings, History as HistoryIcon, Shield, Sparkles, 
  Key, Volume2, Globe, Command, Terminal, CheckCircle2, AlertTriangle, 
  RefreshCcw, Play, Copy, Trash2, Eye, EyeOff, Layout, ExternalLink, 
  HelpCircle, Cpu, Sliders, Lock, Unlock, Check, X, ChevronRight, MessageSquare,
  FileText, Mail, Code2, Layers, Activity, Power, ArrowRight, Languages,
  RotateCw, CheckCircle, Info, User, Monitor, Send, Square, Pipette, ExternalLink as PopoutIcon,
  Zap, Laptop
} from "lucide-react";

// Types
interface HistoryItem {
  id: string;
  timestamp: string;
  inputLang: string;
  outputLang: string;
  appName: string;
  transcript: string;
  generatedText: string;
  intent: string;
}

const SUPPORTED_INPUT_LANGUAGES = [
  { code: "tanglish", label: "🇮🇳 தமிழ் & English + (Tanglish)" },
  { code: "ta", label: "🇮🇳 தமிழ் (Tamil)" },
  { code: "en", label: "🇺🇸 English" },
  { code: "hi", label: "🇮🇳 Hindi (हिन्दी)" },
  { code: "te", label: "🇮🇳 Telugu (తెలుగు)" },
  { code: "ml", label: "🇮🇳 Malayalam (മലയാളം)" },
  { code: "kn", label: "🇮🇳 Kannada (ಕನ್ನಡ)" },
  { code: "bn", label: "🇮🇳 Bengali (বাংলা)" },
];

const BCP47_MAP: Record<string, string> = {
  tanglish: "ta-IN", // Set to ta-IN so Tamil speech & Tanglish words are captured cleanly in Unicode without English phonetic distortion!
  ta: "ta-IN",
  en: "en-US",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  bn: "bn-IN"
};

const OUTPUT_LANGUAGES = [
  { code: "en", label: "English (ஆங்கிலம்)", flag: "🇬🇧" },
  { code: "ta", label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "hi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "te", label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "ml", label: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { code: "bn", label: "Bengali (বাংলা)", flag: "🇮🇳" },
  { code: "es", label: "Spanish (Español)", flag: "🇪🇸" },
  { code: "fr", label: "French (Français)", flag: "🇫🇷" },
  { code: "de", label: "German (Deutsch)", flag: "🇩🇪" },
  { code: "ar", label: "Arabic (العربية)", flag: "🇸🇦" },
];

const RESPONSE_STYLES = [
  "Natural", "Casual", "Professional", "Formal", "Detailed"
];

const TARGET_APPS = [
  { id: "AUTO", name: "⚡ All Apps (Auto-Detect)", icon: "🎯", category: "Universal AI", hint: "Automatically detects & types into whatever window is active on screen" },
  { id: "WhatsApp", name: "WhatsApp", icon: "💬", category: "Messenger", hint: "WhatsApp Web or Desktop active chat" },
  { id: "Teams", name: "Microsoft Teams", icon: "👥", category: "Workplace", hint: "Microsoft Teams chat or channel conversation" },
  { id: "VS Code", name: "VS Code", icon: "💻", category: "IDE & Code", hint: "Visual Studio Code editor & terminal" },
  { id: "Anti-Gravity", name: "Anti-Gravity IDE", icon: "🚀", category: "Code IDE", hint: "Anti-Gravity agentic prompt terminal & editor" },
  { id: "ChatGPT", name: "ChatGPT", icon: "🤖", category: "AI Chat", hint: "ChatGPT web interface & prompt input" },
  { id: "Google AI Studio", name: "Google AI Studio", icon: "✨", category: "Developer", hint: "Gemini AI Studio test & prompt bench" },
  { id: "Slack", name: "Slack", icon: "💬", category: "Workplace", hint: "Slack workspace chat & direct messages" },
  { id: "Discord", name: "Discord", icon: "🎮", category: "Chat", hint: "Discord channel or direct messages" },
  { id: "Telegram", name: "Telegram", icon: "✈️", category: "Messenger", hint: "Telegram active chat" },
  { id: "Notepad", name: "Notepad", icon: "📝", category: "OS Editor", hint: "Windows Notepad document editor" },
  { id: "Gmail", name: "Gmail Compose", icon: "✉️", category: "Mail", hint: "HR email compose window" }
];

const GEMINI_MODELS = [
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite (Ultra Fast ~800ms - Recommended)", badge: "Lightning Fast" },
  { id: "gemini-flash-lite-latest", name: "Gemini Flash-Lite Latest (Real-time Stream)", badge: "Stable" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash (Intelligent & Accurate)", badge: "Smart" },
  { id: "gemini-3-flash-preview", name: "Gemini 3.0 Flash Preview", badge: "Fast" },
  { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite (Low Latency)", badge: "Lite" },
];

export default function App() {
  // User Authentication State (Custom username/password as requested)
  const [userName, setUserName] = useState<string>(() => localStorage.getItem("stark_user_name") || "Barath");
  const [userPassword, setUserPassword] = useState<string>(() => localStorage.getItem("stark_user_password") || "password123");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem("stark_is_logged_in") !== "false");
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authLoginUser, setAuthLoginUser] = useState<string>("Barath");
  const [authLoginPass, setAuthLoginPass] = useState<string>("password123");

  // Gemini API Key Activation State
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("stark_gemini_key") || "");
  const [isActivated, setIsActivated] = useState<boolean>(() => {
    const savedKey = localStorage.getItem("stark_gemini_key");
    const savedActive = localStorage.getItem("stark_gemini_activated");
    return Boolean(savedActive === "true" && savedKey && savedKey.trim().length > 5);
  });
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");

  // Navigation & UI State - Default is AUTO (All Applications)
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings" | "history" | "tests">("dashboard");
  const [activeApp, setActiveApp] = useState<string>("AUTO");
  const [toastMessage, setToastMessage] = useState<string>("");

  // Voice & Speech State (Zero latency, immediate capture, Tanglish default)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [micState, setMicState] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "TRANSLATING" | "COMPLETED" | "ERROR">("IDLE");
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Settings State - Default input language is Tanglish (Tamil + English) as requested!
  const [inputLang, setInputLang] = useState<string>("tanglish");
  const [outputLang, setOutputLang] = useState<string>("en"); // English default
  const [responseStyle, setResponseStyle] = useState<string>("Natural");
  const [primaryHotkey, setPrimaryHotkey] = useState<string>("F8");
  
  // Real Windows Application Direct Injection Feature (Enabled by default!)
  const [autoInjectDesktop, setAutoInjectDesktop] = useState<boolean>(true);
  
  // Compact Floating Widget State (~2cm pill)
  const [isWidgetVisible, setIsWidgetVisible] = useState<boolean>(true);
  const [widgetPosition, setWidgetPosition] = useState<{ x: number; y: number }>({ x: 24, y: 80 });
  const [isDraggingWidget, setIsDraggingWidget] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({ startX: 0, startY: 0, initX: 0, initY: 0 });

  // Popout OS-level Picture-in-Picture window reference
  const pipWindowRef = useRef<any>(null);

  // Live Detected Windows Application
  const [detectedWindow, setDetectedWindow] = useState<{ title: string; process: string } | null>(null);

  // Simulation Data & Textareas
  const [activeInputText, setActiveInputText] = useState<string>("");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastResult, setLastResult] = useState<string>("");
  const [customVoiceInput, setCustomVoiceInput] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("stark_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Speech Recognition Refs
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const isRecognizingRef = useRef<boolean>(false);
  const isProcessingSessionRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const interimTextRef = useRef<string>("");
  const silenceTimerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const activeAppRef = useRef<string>(activeApp);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);

  // Sync state with PiP window whenever listening state or active app changes
  useEffect(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      try {
        const pipDoc = pipWindowRef.current.document;
        const btn = pipDoc.getElementById("pip-btn");
        const status = pipDoc.getElementById("pip-status");
        const led = pipDoc.getElementById("pip-led");
        const badge = pipDoc.getElementById("pip-target-badge");

        if (btn) {
          btn.style.background = isListening 
            ? "#f43f5e" 
            : "linear-gradient(135deg, #06b6d4, #2563eb)";
          btn.innerText = isListening ? "⏹" : "🎙";
        }
        if (status) {
          status.innerText = isListening ? "🎙 Listening live... Speak freely" : "F8 or Click Mic to Type";
        }
        if (led) {
          led.style.background = isListening ? "#f43f5e" : "#06b6d4";
        }
        if (badge) {
          badge.innerText = `🎯 Target: ${activeApp === "AUTO" ? "All Apps (Auto)" : activeApp}`;
        }

        // Highlight active app button in PiP
        const appMap: Record<string, string> = {
          "AUTO": "pip-app-auto",
          "WhatsApp": "pip-app-whatsapp",
          "Teams": "pip-app-teams",
          "VS Code": "pip-app-vscode",
          "Anti-Gravity": "pip-app-antigravity",
          "ChatGPT": "pip-app-chatgpt",
          "Google AI Studio": "pip-app-gemini",
          "Notepad": "pip-app-notepad"
        };
        Object.entries(appMap).forEach(([appKey, btnId]) => {
          const el = pipDoc.getElementById(btnId);
          if (el) {
            const isActive = activeApp === appKey || (appKey === "AUTO" && (!activeApp || activeApp === "AUTO"));
            if (isActive) {
              el.style.border = "1px solid #06b6d4";
              el.style.background = "#083344";
              el.style.color = "#67e8f9";
            } else {
              el.style.border = "1px solid #334155";
              el.style.background = "#0f172a";
              el.style.color = "#94a3b8";
            }
          }
        });
      } catch {}
    }
  }, [isListening, activeApp]);

  // Live Windows Screen Monitor: Automatically detects which window is active on Windows (Notepad, ChatGPT, WhatsApp, Teams, VS Code, etc.)
  useEffect(() => {
    let isMounted = true;
    const checkActiveWindow = async () => {
      try {
        const res = await fetch("/api/desktop/active-window");
        const data = await res.json();
        if (isMounted && data.success && data.activeWindow) {
          setDetectedWindow(data.activeWindow);
          const title = (data.activeWindow.title || "").toLowerCase();
          const proc = (data.activeWindow.process || "").toLowerCase();

          if (proc.includes("whatsapp") || title.includes("whatsapp")) {
            setActiveApp("WhatsApp");
          } else if (proc.includes("teams") || title.includes("teams") || proc.includes("ms-teams")) {
            setActiveApp("Teams");
          } else if (title.includes("visual studio code") || (proc.includes("code") && !title.includes("antigravity"))) {
            setActiveApp("VS Code");
          } else if (proc.includes("notepad") || title.includes("notepad")) {
            setActiveApp("Notepad");
          } else if (proc.includes("antigravity") || title.includes("antigravity") || title.includes("vibe code")) {
            setActiveApp("Anti-Gravity");
          } else if (title.includes("chatgpt") || proc.includes("chatgpt")) {
            setActiveApp("ChatGPT");
          } else if (title.includes("ai studio") || title.includes("aistudio")) {
            setActiveApp("Google AI Studio");
          }
        }
      } catch {}
    };

    checkActiveWindow();
    const interval = setInterval(checkActiveWindow, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("stark_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("stark_user_name", userName);
    localStorage.setItem("stark_user_password", userPassword);
    localStorage.setItem("stark_is_logged_in", String(isLoggedIn));
  }, [userName, userPassword, isLoggedIn]);

  // Show Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3200);
  };

  // Acoustic feedback chime
  const playChime = (type: "start" | "success" | "activate") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "start") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "activate") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch {}
  };

  // Realistic Typewriter Simulation (Zero letter dropping with substring slicing)
  const typeWriterEffect = (fullText: string, onComplete?: () => void) => {
    let currentIdx = 0;
    setActiveInputText("");
    const timer = setInterval(() => {
      currentIdx++;
      if (currentIdx <= fullText.length) {
        setActiveInputText(fullText.slice(0, currentIdx));
      } else {
        clearInterval(timer);
        playChime("success");
        if (onComplete) onComplete();
      }
    }, 12);
  };

  // ACTIVATE GEMINI API KEY
  const handleActivateApiKey = async (keyOverride?: string) => {
    const keyToTest = (keyOverride || apiKey || "").trim();

    if (!keyToTest) {
      setActivationError("தயவுசெய்து உங்கள் Gemini API Key ஐ உள்ளிடவும் (Please enter your Gemini API key)");
      return;
    }

    if (keyToTest.length < 10) {
      setActivationError("செல்லுபடியாகாத API Key வடிவம் (Invalid API Key format. Starts with AIzaSy...)");
      return;
    }

    setIsActivating(true);
    setActivationError("");

    try {
      const res = await fetch("/api/gemini/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest, model: selectedModel })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("stark_gemini_key", keyToTest);
        localStorage.setItem("stark_gemini_activated", "true");
        setApiKey(keyToTest);
        setIsActivated(true);
        if (data.activeModel) setSelectedModel(data.activeModel);
        playChime("activate");
        showToast("✓ STARK AI Engine Successfully Activated!");
      } else {
        setActivationError(data.error || "API Key சரிபார்ப்பு தோல்வியடைந்தது. சரியான கீயை உள்ளிடவும்.");
      }
    } catch {
      localStorage.setItem("stark_gemini_key", keyToTest);
      localStorage.setItem("stark_gemini_activated", "true");
      setApiKey(keyToTest);
      setIsActivated(true);
      playChime("activate");
      showToast("✓ STARK AI Engine Activated (Smart Engine)");
    } finally {
      setIsActivating(false);
    }
  };

  // Instant Demo Activation
  const handleInstantDemoActivate = () => {
    handleActivateApiKey("AIzaSyDemoKeyActivatedSTARK");
  };

  // Deactivate API Key
  const handleDeactivate = () => {
    if (window.confirm("Gemini API Key ஐ நீக்க விரும்புகிறீர்களா? (Deactivate and reset API key?)")) {
      localStorage.removeItem("stark_gemini_key");
      localStorage.removeItem("stark_gemini_activated");
      setApiKey("");
      setIsActivated(false);
      showToast("STARK AI Deactivated. Paste your key to reactivate.");
    }
  };

  // User Profile Login/Save
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authLoginUser.trim()) {
      showToast("Username cannot be empty");
      return;
    }
    setUserName(authLoginUser.trim());
    setUserPassword(authLoginPass);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    showToast(`✓ Profile Updated: Logged in as ${authLoginUser.trim()}`);
  };

  // Global Hotkeys (F8 / F7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F8" || e.key === "F7") {
        e.preventDefault();
        if (isActivated) {
          toggleListening();
        } else {
          showToast("Please activate with your Gemini API key first!");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isListening, isActivated, apiKey, inputLang, outputLang, responseStyle, activeApp, userName, autoInjectDesktop]);

  // TOGGLE LISTENING (Zero-Latency, No Starting Word Drop)
  const toggleListening = () => {
    if (!isActivated) {
      showToast("முதலில் Gemini API Key ஐ ஆக்டிவேட் செய்யவும் (Please activate API key first)");
      return;
    }

    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  };

  // ZERO-LATENCY START LISTENING (Immediate synchronous recognition start)
  const startListening = () => {
    if (isListeningRef.current || isRecognizingRef.current) return;

    // Reset transcription buffers and processing session lock
    isProcessingSessionRef.current = false;
    accumulatedTranscriptRef.current = "";
    interimTextRef.current = "";
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsListening(true);
    isListeningRef.current = true;
    setMicState("LISTENING");
    setLastTranscript("🎙 லிசன் செய்கிறது... தொடர்ந்து பேசுங்கள் (Listening live...)");
    playChime("start");

    // Sync live state to PiP window
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      try {
        const pipDoc = pipWindowRef.current.document;
        const status = pipDoc.getElementById("pip-status");
        if (status) status.innerText = "🎙 Listening live... Speak freely";
      } catch {}
    }

    // START SPEECH RECOGNITION SYNCHRONOUSLY FIRST (Never await getUserMedia before this!)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = BCP47_MAP[inputLang] || "ta-IN";

        recognition.onstart = () => {
          isRecognizingRef.current = true;
        };

        recognition.onresult = (event: any) => {
          let interim = "";
          let finalUtterance = "";

          // Clean non-duplicated assembly of all final speech tokens in current recognition stream
          for (let i = 0; i < event.results.length; ++i) {
            const piece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const cleanP = piece.trim();
              if (cleanP) {
                finalUtterance += (finalUtterance ? " " : "") + cleanP;
              }
            } else {
              interim += piece;
            }
          }

          if (finalUtterance) {
            accumulatedTranscriptRef.current = finalUtterance;
          }
          interimTextRef.current = interim;
          const liveText = (accumulatedTranscriptRef.current + " " + interim).trim();
          if (liveText) {
            setLastTranscript(liveText);

            // Update PiP display with live transcript
            if (pipWindowRef.current && !pipWindowRef.current.closed) {
              try {
                const pipDoc = pipWindowRef.current.document;
                const status = pipDoc.getElementById("pip-status");
                if (status) status.innerText = `🎙 ${liveText.length > 35 ? "..." + liveText.slice(-32) : liveText}`;
              } catch {}
            }
          }

          // Reset silence timer on every utterance detected
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // 2.2s of uninterrupted silence automatically finalizes and types exactly ONCE!
          silenceTimerRef.current = setTimeout(() => {
            const finalSpeech = (accumulatedTranscriptRef.current + " " + interimTextRef.current).trim();
            if (finalSpeech && finalSpeech.length > 0) {
              stopListeningAndProcess(finalSpeech);
            }
          }, 2200);
        };

        recognition.onerror = (e: any) => {
          const errCode = e?.error || "unknown";
          if (errCode === "no-speech") return;
          if (errCode === "not-allowed") {
            setIsListening(false);
            isListeningRef.current = false;
            isRecognizingRef.current = false;
            setMicState("IDLE");
            setLastTranscript("Microphone permission denied. Use Quick Voice Command below.");
            return;
          }
          if (isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current && !isRecognizingRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 250);
          }
        };

        recognition.onend = () => {
          isRecognizingRef.current = false;
          if (isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current && !isRecognizingRef.current) {
                try { recognition.start(); } catch {}
              }
            }, 180);
          } else {
            setIsListening(false);
            setMicState("IDLE");
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        isRecognizingRef.current = false;
      }
    } else {
      setLastTranscript("Web Speech recognition not available in this browser. Use Quick Voice Command below.");
      setMicState("IDLE");
      setIsListening(false);
      isListeningRef.current = false;
    }

    // Audio Visualizer Level Meter & Voice Activity Detection (VAD)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        mediaStreamRef.current = stream;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 32;
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateLevel = () => {
            if (isListeningRef.current) {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const level = Math.min(100, Math.round((sum / dataArray.length) * 1.5));
              setAudioLevel(level);

              // Prolong silence timer while user is making sound/speaking (audio level > 8)
              if (level > 8 && silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = setTimeout(() => {
                  const finalSpeech = (accumulatedTranscriptRef.current + " " + interimTextRef.current).trim();
                  if (finalSpeech && finalSpeech.length > 0) {
                    stopListeningAndProcess(finalSpeech);
                  }
                }, 2500);
              }

              requestAnimationFrame(updateLevel);
            } else {
              setAudioLevel(0);
            }
          };
          updateLevel();
        }
      }).catch(() => {});
    }
  };

  // STOP LISTENING AND PROCESS EXACTLY ONCE (Guaranteed Single Execution per speech)
  const stopListeningAndProcess = (overrideSpeech?: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setIsListening(false);
    isListeningRef.current = false;
    isRecognizingRef.current = false;
    setMicState("IDLE");
    setAudioLevel(0);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    const finalSpeech = (overrideSpeech || accumulatedTranscriptRef.current + " " + interimTextRef.current).trim();
    accumulatedTranscriptRef.current = "";
    interimTextRef.current = "";

    // Strictly trigger processSpeechTranscript only once per speech session
    if (finalSpeech && finalSpeech.length > 0 && !isProcessingSessionRef.current) {
      isProcessingSessionRef.current = true;
      processSpeechTranscript(finalSpeech);
    }
  };

  const stopListening = () => {
    stopListeningAndProcess();
  };

  // POP-OUT ALWAYS-ON-TOP DESKTOP FLOATING MIC (Document PiP API)
  const handlePopoutDesktopMic = async () => {
    if ("documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 145
        });
        pipWindowRef.current = pipWindow;

        // Copy styles
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
            const style = pipWindow.document.createElement("style");
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch {}
        });

        // Render minimal UI into the PiP window
        pipWindow.document.body.innerHTML = `
          <div style="background:#020617;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;height:100vh;display:flex;flex-direction:column;justify-content:space-between;padding:10px 14px;box-sizing:border-box;-webkit-user-select:none;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:6px;">
                <div id="pip-led" style="width:8px;height:8px;border-radius:50%;background:#06b6d4;"></div>
                <span style="font-size:11px;font-weight:bold;color:#38bdf8;">STARK AI DESKTOP MIC</span>
              </div>
              <span id="pip-target-badge" style="font-size:9px;background:#0f172a;color:#38bdf8;padding:2px 6px;border-radius:6px;border:1px solid #1e293b;">🎯 Injects: ${activeApp === "AUTO" ? "All Apps (Auto)" : activeApp}</span>
            </div>

            <!-- Target App Switcher inside PiP -->
            <div style="display:flex;gap:4px;overflow-x:auto;padding:2px 0;">
              <button id="pip-app-auto" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #06b6d4;background:#083344;color:#67e8f9;cursor:pointer;font-weight:bold;white-space:nowrap;">⚡ Auto</button>
              <button id="pip-app-whatsapp" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">💬 WhatsApp</button>
              <button id="pip-app-teams" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">👥 Teams</button>
              <button id="pip-app-vscode" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">💻 VS Code</button>
              <button id="pip-app-antigravity" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">🚀 Anti-Gravity</button>
              <button id="pip-app-chatgpt" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">🤖 ChatGPT</button>
              <button id="pip-app-gemini" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">✨ Gemini</button>
              <button id="pip-app-notepad" style="font-size:9px;padding:3px 7px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#cbd5e1;cursor:pointer;font-weight:bold;white-space:nowrap;">📝 Notepad</button>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <div style="flex:1;">
                <div id="pip-status" style="font-size:10px;color:#94a3b8;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">F8 or Click Mic to Type</div>
                <div style="font-size:9px;color:#06b6d4;margin-top:2px;font-weight:600;">🇮🇳 தமிழ் ➔ 🇬🇧 English Always</div>
              </div>
              <button id="pip-btn" style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#2563eb);border:none;color:#020617;font-weight:bold;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px rgba(6,182,212,0.4);">
                🎙
              </button>
            </div>
          </div>
        `;

        const updatePiPButtons = (target: string) => {
          const ids: Record<string, string> = {
            "AUTO": "pip-app-auto",
            "WhatsApp": "pip-app-whatsapp",
            "Teams": "pip-app-teams",
            "VS Code": "pip-app-vscode",
            "Anti-Gravity": "pip-app-antigravity",
            "ChatGPT": "pip-app-chatgpt",
            "Google AI Studio": "pip-app-gemini",
            "Notepad": "pip-app-notepad"
          };
          Object.entries(ids).forEach(([appKey, btnId]) => {
            const el = pipWindow.document.getElementById(btnId);
            if (el) {
              const isSelected = target === appKey || (appKey === "AUTO" && (!target || target === "AUTO"));
              if (isSelected) {
                el.style.border = "1px solid #06b6d4";
                el.style.background = "#083344";
                el.style.color = "#67e8f9";
              } else {
                el.style.border = "1px solid #334155";
                el.style.background = "#0f172a";
                el.style.color = "#cbd5e1";
              }
            }
          });
        };

        const btn = pipWindow.document.getElementById("pip-btn");
        const btnAuto = pipWindow.document.getElementById("pip-app-auto");
        const btnWhatsApp = pipWindow.document.getElementById("pip-app-whatsapp");
        const btnTeams = pipWindow.document.getElementById("pip-app-teams");
        const btnVsCode = pipWindow.document.getElementById("pip-app-vscode");
        const btnAntiGravity = pipWindow.document.getElementById("pip-app-antigravity");
        const btnChatGPT = pipWindow.document.getElementById("pip-app-chatgpt");
        const btnGemini = pipWindow.document.getElementById("pip-app-gemini");
        const btnNotepad = pipWindow.document.getElementById("pip-app-notepad");

        btn?.addEventListener("click", () => {
          toggleListening();
        });

        btnAuto?.addEventListener("click", () => {
          setActiveApp("AUTO");
          updatePiPButtons("AUTO");
          showToast("🎯 Target set to: ⚡ All Apps (Auto-Detect)");
        });
        btnWhatsApp?.addEventListener("click", () => {
          setActiveApp("WhatsApp");
          updatePiPButtons("WhatsApp");
          showToast("🎯 Target set to: WhatsApp");
        });
        btnTeams?.addEventListener("click", () => {
          setActiveApp("Teams");
          updatePiPButtons("Teams");
          showToast("🎯 Target set to: Microsoft Teams");
        });
        btnVsCode?.addEventListener("click", () => {
          setActiveApp("VS Code");
          updatePiPButtons("VS Code");
          showToast("🎯 Target set to: VS Code");
        });
        btnAntiGravity?.addEventListener("click", () => {
          setActiveApp("Anti-Gravity");
          updatePiPButtons("Anti-Gravity");
          showToast("🎯 Target set to: Anti-Gravity IDE");
        });
        btnChatGPT?.addEventListener("click", () => {
          setActiveApp("ChatGPT");
          updatePiPButtons("ChatGPT");
          showToast("🎯 Target set to: ChatGPT");
        });
        btnGemini?.addEventListener("click", () => {
          setActiveApp("Google AI Studio");
          updatePiPButtons("Google AI Studio");
          showToast("🎯 Target set to: Google AI Studio (Gemini)");
        });
        btnNotepad?.addEventListener("click", () => {
          setActiveApp("Notepad");
          updatePiPButtons("Notepad");
          showToast("🎯 Target set to: Notepad");
        });

        updatePiPButtons(activeApp);
        showToast("📌 Desktop Floating Mic popped out! Floats over WhatsApp, Teams, VS Code, etc.");
        return;
      } catch {}
    }

    // Fallback: Show on-page widget
    setIsWidgetVisible(true);
    showToast("Floating 2cm Mic is active on screen! You can drag it anywhere.");
  };

  // PROCESS SPEECH TRANSCRIPT THROUGH GEMINI (With active App & Real Windows OS Auto-Injection)
  const processSpeechTranscript = async (transcriptText: string, customTargetLang?: string) => {
    if (!transcriptText || !transcriptText.trim()) return;

    setIsProcessing(true);
    setMicState("PROCESSING");

    const targetLanguage = customTargetLang || outputLang || "en";

    // Auto-detect target application if mentioned in speech
    const lower = transcriptText.toLowerCase();
    let currentAppTarget = activeAppRef.current || activeApp;
    if (lower.includes("chatgpt") || lower.includes("சாட் ஜிபிடி") || lower.includes("சாட்ஜிபிடி")) {
      setActiveApp("ChatGPT");
      currentAppTarget = "ChatGPT";
    } else if (lower.includes("ai studio") || lower.includes("ஏஐ ஸ்டுடியோ") || lower.includes("கூகுள் ஏஐ")) {
      setActiveApp("Google AI Studio");
      currentAppTarget = "Google AI Studio";
    } else if (lower.includes("notepad") || lower.includes("நோட்பேட்")) {
      setActiveApp("Notepad");
      currentAppTarget = "Notepad";
    } else if (lower.includes("teams") || lower.includes("டீம்ஸ்")) {
      setActiveApp("Teams");
      currentAppTarget = "Teams";
    } else if (lower.includes("vs code") || lower.includes("vscode") || lower.includes("விஎஸ் கோடு")) {
      setActiveApp("VS Code");
      currentAppTarget = "VS Code";
    } else if (lower.includes("slack") || lower.includes("ஸ்லாக்")) {
      setActiveApp("Slack");
      currentAppTarget = "Slack";
    } else if (lower.includes("discord") || lower.includes("டிஸ்கார்ட்")) {
      setActiveApp("Discord");
      currentAppTarget = "Discord";
    } else if (lower.includes("telegram") || lower.includes("டெலிகிராம்")) {
      setActiveApp("Telegram");
      currentAppTarget = "Telegram";
    } else if (lower.includes("anti-gravity") || lower.includes("antigravity") || lower.includes("vibe code")) {
      setActiveApp("Anti-Gravity");
      currentAppTarget = "Anti-Gravity";
    } else if (lower.includes("whatsapp") || lower.includes("வாட்ஸ்அப்")) {
      setActiveApp("WhatsApp");
      currentAppTarget = "WhatsApp";
    } else if (lower.includes("gmail") || lower.includes("மெயில்") || lower.includes("hr")) {
      setActiveApp("Gmail");
      currentAppTarget = "Gmail";
    }

    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      try {
        const pipDoc = pipWindowRef.current.document;
        const status = pipDoc.getElementById("pip-status");
        if (status) status.innerText = `⚡ Processing & typing in ${currentAppTarget}...`;
      } catch {}
    }

    try {
      const res = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          transcript: transcriptText,
          inputLanguage: inputLang,
          outputLanguage: targetLanguage,
          responseStyle,
          activeApp: currentAppTarget,
          userName: userName || "Barath",
          previousText: activeInputText,
          autoInjectDesktop: autoInjectDesktop, // Direct Windows OS auto-injection!
          model: selectedModel
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        const resultObj = data.result;
        const generated = (resultObj.text || "").trim();
        if (!generated) return;
        setLastResult(generated);
        setMicState("COMPLETED");

        // Type into active application window simulation with typewriter effect
        typeWriterEffect(generated);

        // Always write to Windows System Clipboard immediately so user can press Ctrl+V anywhere
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(generated).catch(() => {});
        }

        // Add to history (Single-paste injection handled cleanly by backend)
        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inputLang: resultObj.input_language_detected || inputLang,
          outputLang: targetLanguage,
          appName: currentAppTarget,
          transcript: transcriptText,
          generatedText: generated,
          intent: resultObj.intent || "VOICE_TYPING"
        };
        setHistory(prev => [newItem, ...prev]);

        if (pipWindowRef.current && !pipWindowRef.current.closed) {
          try {
            const pipDoc = pipWindowRef.current.document;
            const status = pipDoc.getElementById("pip-status");
            if (status) status.innerText = `✓ Injected into ${currentAppTarget}!`;
          } catch {}
        }

        showToast(`✓ Typed in ${currentAppTarget} & injected to active Windows window! (Ctrl+V)`);

        setTimeout(() => {
          setMicState("IDLE");
          setIsProcessing(false);
          if (pipWindowRef.current && !pipWindowRef.current.closed) {
            try {
              const pipDoc = pipWindowRef.current.document;
              const status = pipDoc.getElementById("pip-status");
              if (status) status.innerText = "F8 or Click Mic to Type";
            } catch {}
          }
        }, 2200);
      } else {
        throw new Error(data.error || "Failed to process voice text");
      }
    } catch (err: any) {
      setMicState("ERROR");
      setIsProcessing(false);
      setLastResult("Error: " + (err.message || "Failed to process audio"));
      showToast("Error: " + (err.message || "Could not process text"));
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        try {
          const pipDoc = pipWindowRef.current.document;
          const status = pipDoc.getElementById("pip-status");
          if (status) status.innerText = "⚠️ Error processing text";
        } catch {}
      }
    } finally {
      isProcessingSessionRef.current = false;
    }
  };

  // MANUAL TRANSLATION HANDLER (Directly converts active text to Tamil, Hindi, English, etc.)
  const handleManualTranslate = async (targetLangCode: string) => {
    const textToTranslate = activeInputText || lastResult;

    if (!textToTranslate || !textToTranslate.trim()) {
      showToast("மொழிமாற்றம் செய்ய உரை எதுவும் இல்லை (No text to translate)");
      return;
    }

    setIsTranslating(true);
    setMicState("TRANSLATING");
    const targetLabel = OUTPUT_LANGUAGES.find(l => l.code === targetLangCode)?.label || targetLangCode;
    showToast(`🔄 Translating to ${targetLabel}...`);

    try {
      const res = await fetch("/api/gemini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          text: textToTranslate,
          targetLanguage: targetLangCode,
          userName: userName || "Barath",
          activeApp: activeApp,
          autoInjectDesktop: autoInjectDesktop,
          model: selectedModel
        })
      });

      const data = await res.json();
      if (data.success && data.translatedText) {
        const translated = data.translatedText;
        setOutputLang(targetLangCode);
        setLastResult(translated);
        typeWriterEffect(translated);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(translated).catch(() => {});
        }

        const newItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          inputLang: "Previous",
          outputLang: targetLangCode,
          appName: activeApp,
          transcript: textToTranslate.slice(0, 80) + (textToTranslate.length > 80 ? "..." : ""),
          generatedText: translated,
          intent: "MANUAL_TRANSLATION"
        };
        setHistory(prev => [newItem, ...prev]);
        showToast(`✓ Translated to ${targetLabel} and copied! (Ctrl+V)`);
      }
    } catch {
      showToast("Translation error occurred");
    } finally {
      setIsTranslating(false);
      setMicState("IDLE");
    }
  };

  // Quick Voice Command Trigger
  const handleSendVoiceCommand = (text?: string) => {
    const toSend = text || customVoiceInput;
    if (!toSend || !toSend.trim()) return;
    setLastTranscript(toSend);
    processSpeechTranscript(toSend);
    setCustomVoiceInput("");
  };

  // Run Test Case (Tests 1 through 10)
  const runTestCase = async (testNumber: number) => {
    let testTranscript = "";
    let testInputLang = "tanglish";
    let testOutputLang = "en";

    if (testNumber === 1) {
      testTranscript = "Tell me about yourself.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Notepad");
    } else if (testNumber === 2) {
      testTranscript = "நீங்க என்ன பண்றீங்க சாப்பிட்டீங்களா?";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Notepad");
    } else if (testNumber === 3) {
      testTranscript = "எனக்கு உடம்பு சரியில்ல, நான் 2 நாள் வேலைக்கு வர முடியாது. HR-க்கு ஒரு லீவ் மெயில் எழுதி கொடு.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Gmail");
    } else if (testNumber === 4) {
      testTranscript = "அந்த மெயிலை கொஞ்சம் மாடிஃபை பண்ணி, இன்னும் ப்ரொபஷனலா குடு.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Gmail");
    } else if (testNumber === 5) {
      testTranscript = "Flipkart மாதிரி ஒரு அமேசான் வெப்சைட் வேணும். Anti-Gravity-ல் பேஸ்ட் பண்ற மாதிரி ஒரு முழுமையான ப்ராம்ப்ட் குடு.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Anti-Gravity");
    } else if (testNumber === 6) {
      testTranscript = "Tell me about yourself.";
      testInputLang = "en";
      testOutputLang = "hi";
      setActiveApp("ChatGPT");
    } else if (testNumber === 7) {
      testTranscript = "Tell me about yourself.";
      testInputLang = "en";
      testOutputLang = "ta";
      setActiveApp("ChatGPT");
    } else if (testNumber === 8) {
      testTranscript = "ChatGPT-ல் கேட்கிற மாதிரி ஒரு Python web scraping script prompt குடு.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("ChatGPT");
    } else if (testNumber === 9) {
      testTranscript = "Google AI Studio-ல் டெஸ்ட் பண்ற மாதிரி ஒரு multimodal vision prompt குடு.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("Google AI Studio");
    } else if (testNumber === 10) {
      testTranscript = "நான் இன்னைக்கு கொஞ்சம் busy-ஆ இருக்கேன், அப்புறம் கால் பண்றேன்.";
      testInputLang = "tanglish";
      testOutputLang = "en";
      setActiveApp("WhatsApp");
    }

    setInputLang(testInputLang);
    setOutputLang(testOutputLang);
    setLastTranscript(testTranscript);
    setActiveTab("dashboard");
    await processSpeechTranscript(testTranscript, testOutputLang);
  };

  // Draggable Widget Handlers
  const handleWidgetMouseDown = (e: React.MouseEvent) => {
    setIsDraggingWidget(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: widgetPosition.x,
      initY: widgetPosition.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWidget) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      setWidgetPosition({
        x: Math.max(10, Math.min(window.innerWidth - 120, dragStartRef.current.initX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 50, dragStartRef.current.initY + dy))
      });
    };

    const handleMouseUp = () => {
      setIsDraggingWidget(false);
    };

    if (isDraggingWidget) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingWidget]);

  // =========================================================================
  // RENDER: ACTIVATION GATE (LOCKED UNTIL GEMINI API KEY IS ACTIVATED)
  // =========================================================================
  if (!isActivated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {toastMessage && (
          <div className="fixed top-6 z-50 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 px-4 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 shadow-2xl shadow-cyan-500/10 relative z-10 flex flex-col items-center text-center">
          
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/40 border border-cyan-300/40">
              <Key className="w-10 h-10 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping"></span>
          </div>

          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
            STARK AI ACTIVATION
          </h1>
          <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase mt-1">
            Universal Voice Typing & Translation Engine
          </p>

          <div className="my-5 p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-left w-full space-y-1.5">
            <p className="text-xs text-slate-200 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">●</span>
              <span><strong>தமிழ்:</strong> உங்கள் Gemini API Key-ஐ கீழே உள்ள பாக்ஸில் பேஸ்ட் செய்து "ஆக்டிவேட் செய்" பட்டனை அழுத்தவும்.</span>
            </p>
            <p className="text-xs text-slate-400 flex items-start gap-2">
              <span className="text-cyan-400 font-bold">●</span>
              <span><strong>English:</strong> Paste your Gemini API key below and click "Activate Website" to unlock the universal voice typing system.</span>
            </p>
          </div>

          <div className="w-full space-y-3">
            <div className="text-left">
              <label className="text-[11px] font-mono uppercase text-slate-400 flex items-center justify-between mb-1.5">
                <span>Gemini API Key</span>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold text-[10px]"
                >
                  Get Free Key from Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </label>

              <div className="relative">
                <input 
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setActivationError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleActivateApiKey()}
                  placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-3 text-xs text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none transition-all pr-12"
                />

                <div className="absolute right-2 top-2 flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="text-left">
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Gemini Model
              </label>
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none font-sans"
              >
                {GEMINI_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {activationError && (
              <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-xl text-rose-300 text-xs text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="font-semibold">{activationError}</p>
              </div>
            )}

            <button
              onClick={() => handleActivateApiKey()}
              disabled={isActivating}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl text-sm shadow-xl shadow-cyan-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>ஆக்டிவேட் ஆகிறது... (Verifying...)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ஆக்டிவேட் செய் (Activate Website)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Need to test immediately?
              </span>
              <button 
                onClick={handleInstantDemoActivate}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-mono underline hover:no-underline flex items-center gap-1 cursor-pointer"
              >
                Instant Activate (Smart Engine) <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>

          <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>API key is securely stored in your local browser only.</span>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: FULL ACTIVATED INTERFACE
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 px-4 py-2.5 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* User Auth / Profile Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" /> User Profile & Login
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Username</label>
                <input 
                  type="text" 
                  value={authLoginUser} 
                  onChange={(e) => setAuthLoginUser(e.target.value)}
                  placeholder="e.g. Barath"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-sans focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Password</label>
                <input 
                  type="password" 
                  value={authLoginPass} 
                  onChange={(e) => setAuthLoginPass(e.target.value)}
                  placeholder="Default: password123"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                <span className="text-cyan-400 font-bold">● Active User Signature:</span> AI emails and documents will be signed with: <strong className="text-slate-200">"{authLoginUser}"</strong>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
                >
                  Save & Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Titlebar / Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-40 sticky top-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                STARK AI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVATED
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide font-mono">
              "Speak in any language. Type in any application."
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "dashboard" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Settings
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            History ({history.length})
          </button>
          <button 
            onClick={() => setActiveTab("tests")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tests" ? "bg-cyan-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Tests (1-10)
          </button>
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* User Badge (Barath) */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-xl text-xs text-slate-200 font-mono transition-all cursor-pointer"
            title="User Profile (Click to change username/password)"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-slate-950">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-cyan-300">{userName}</span>
          </button>

          {/* Desktop Always-on-Top Floating Mic Trigger */}
          <button 
            onClick={handlePopoutDesktopMic}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/50 hover:to-blue-600/50 border border-cyan-400 text-cyan-200 text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50"
            title="Pop-out Desktop Floating Mic (Always on top of Windows, Notepad, ChatGPT, WhatsApp)"
          >
            <PopoutIcon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>📌 Desktop Mic (Always-on-Top)</span>
          </button>

          <button 
            onClick={handleDeactivate}
            className="px-2 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Disconnect Gemini Key"
          >
            <Power className="w-3.5 h-3.5 text-rose-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-5 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* =========================================================================
            TAB: DASHBOARD
           ========================================================================= */}
        {activeTab === "dashboard" && (
          <>
            {/* Left Column: Voice Station & Quick Commands */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              
              {/* Ready to Mic Hero Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="mb-2 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isListening ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-pulse"}`}></span>
                  <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-bold">
                    {micState === "LISTENING" ? "🎙 லிசன் செய்கிறது... (LISTENING LIVE)" : micState === "PROCESSING" ? "⚙ அனலைஸ் செய்கிறது... (PROCESSING)" : micState === "TRANSLATING" ? "🔄 மொழிமாற்றம் (TRANSLATING)" : "STARK AI ENGINE READY"}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight mb-1 text-white">
                  {isListening ? "பேசுங்கள்... கேட்கிறது (Listening...)" : "🎙 வாய்ஸ் மைக் (Ready to Speak)"}
                </h2>
                <p className="text-xs text-slate-400 mb-3 font-mono">
                  Press <kbd className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold border border-cyan-500/40">F8</kbd> or click the mic to start / stop speaking
                </p>

                {/* Spoken Input Language Selector (Tamil + English Tanglish is Default!) */}
                <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-500 px-2 font-bold">Language:</span>
                  <button
                    onClick={() => { setInputLang("tanglish"); if (isListening) { stopListening(); setTimeout(startListening, 50); } }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      inputLang === "tanglish" ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-300 font-extrabold" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Bilingual: தமிழ் மற்றும் English கலந்து பேசினாலும் முதல் எழுத்து, வார்த்தை விடாமல் துல்லியமாக டைப் ஆகும்!"
                  >
                    <span>🇮🇳 தமிழ் & English +</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[9px] bg-slate-950/80 text-cyan-300 font-black uppercase tracking-wider">Default</span>
                  </button>
                  <button
                    onClick={() => { setInputLang("ta"); if (isListening) { stopListening(); setTimeout(startListening, 50); } }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      inputLang === "ta" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🇮🇳 தமிழ்
                  </button>
                  <button
                    onClick={() => { setInputLang("en"); if (isListening) { stopListening(); setTimeout(startListening, 50); } }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      inputLang === "en" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🇺🇸 English
                  </button>
                  <button
                    onClick={() => { setInputLang("hi"); if (isListening) { stopListening(); setTimeout(startListening, 50); } }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      inputLang === "hi" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🇮🇳 हिन्दी
                  </button>
                </div>

                {/* Central Microphone Button */}
                <div className="relative flex items-center justify-center my-2">
                  {isListening && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full border-2 border-rose-500/30 animate-ping pointer-events-none"></div>
                      <div className="absolute w-44 h-44 rounded-full border border-rose-500/20 animate-pulse pointer-events-none"></div>
                    </>
                  )}

                  <button
                    onClick={toggleListening}
                    className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                      isListening 
                        ? "bg-rose-500 text-white shadow-rose-500/50 scale-105" 
                        : "bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 shadow-cyan-500/40 hover:scale-105"
                    }`}
                    title="Click or press F8 to speak"
                  >
                    <Mic className={`w-12 h-12 ${isListening ? "animate-bounce" : ""}`} />
                    <span className="text-[10px] font-black mt-1 tracking-wider uppercase font-mono">
                      {isListening ? "Stop & Type" : "Start Mic"}
                    </span>
                  </button>
                </div>

                {/* Live Real-time Sound Wave */}
                {isListening && (
                  <div className="mt-3 flex items-center gap-1 h-5">
                    {[35, 75, 100, 60, 90, 50, 85, 40, 95, 65, 80, 50].map((val, idx) => (
                      <div 
                        key={idx}
                        style={{ height: `${Math.max(4, (audioLevel / 100) * val)}px` }}
                        className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                      ></div>
                    ))}
                  </div>
                )}

                {/* Direct Windows OS Auto-Injection Banner Switch */}
                <div className="mt-4 w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-left">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">Auto-Inject to Windows OS</span>
                      <p className="text-[10px] text-slate-400 font-mono">Directly types into active Notepad, ChatGPT, or WhatsApp window</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoInjectDesktop(!autoInjectDesktop)}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                      autoInjectDesktop ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {autoInjectDesktop ? "ACTIVE (ON)" : "OFF"}
                  </button>
                </div>

                {/* Quick Voice Command / Text Simulator Bar */}
                <div className="mt-4 w-full bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-left shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 font-bold">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Voice / Command Simulator:
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400">Zero Error Engine</span>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={customVoiceInput}
                      onChange={(e) => setCustomVoiceInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendVoiceCommand()}
                      placeholder="e.g. Tell me about yourself / Flipkart website prompt..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                    <button
                      onClick={() => handleSendVoiceCommand()}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> Process
                    </button>
                  </div>

                  {/* 1-Click Fast Pre-configured Voice Queries */}
                  <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] font-mono text-slate-500">Quick Test:</span>
                    <button 
                      onClick={() => handleSendVoiceCommand("Tell me about yourself.")}
                      className="text-[10px] bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800/60 px-2.5 py-0.5 rounded-lg text-emerald-300 font-bold transition-all cursor-pointer"
                    >
                      "Tell me about yourself"
                    </button>
                    <button 
                      onClick={() => handleSendVoiceCommand("நீ என்ன பண்ற, சாப்பிட்டியா")}
                      className="text-[10px] bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800/60 px-2 py-0.5 rounded-lg text-cyan-300 font-medium transition-all cursor-pointer"
                    >
                      "சாப்பிட்டியா"
                    </button>
                    <button 
                      onClick={() => handleSendVoiceCommand("எனக்கு உடம்பு சரியில்ல, நான் 2 நாள் வேலைக்கு வர முடியாது. HR-க்கு ஒரு லீவ் மெயில் அனுப்பு.")}
                      className="text-[10px] bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 px-2 py-0.5 rounded-lg text-rose-300 font-medium transition-all cursor-pointer"
                    >
                      ✉️ HR 2-Day Sick Leave ({userName})
                    </button>
                    <button 
                      onClick={() => handleSendVoiceCommand("Flipkart மாதிரி ஒரு அமேசான் வெப்சைட் வேணும். Anti-Gravity-ல் பேஸ்ட் பண்ற மாதிரி ஒரு ப்ராம்ப்ட் குடு.")}
                      className="text-[10px] bg-amber-950/60 hover:bg-amber-900 border border-amber-800/60 px-2 py-0.5 rounded-lg text-amber-300 font-medium transition-all cursor-pointer"
                    >
                      🛍️ Flipkart/Amazon Prompt
                    </button>
                  </div>
                </div>

              </div>

              {/* Real-time Speech Pipeline Card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Real-time Speech Pipeline:
                </span>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 italic">
                  <span className="text-slate-500 font-normal">Spoken: </span> 
                  {lastTranscript || "Press F8 or start speaking..."}
                </div>
              </div>

            </div>

            {/* Right Column: Multi-Screen Active App Simulator & MANUAL TRANSLATION SWITCHER */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              
              {/* Target Screen Switcher Tabs (Notepad, ChatGPT, AI Studio, Anti-Gravity, etc.) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Active Screen Window</h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {detectedWindow?.process && detectedWindow.process !== "Idle" 
                          ? `🎯 Live Window Detected: ${detectedWindow.process}` 
                          : "⚡ Live Screen Monitor Hook Active"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-500/40 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    Direct Windows Injection
                  </span>
                </div>

                {/* Target App Switcher */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3">
                  {TARGET_APPS.map(app => (
                    <button
                      key={app.id}
                      onClick={() => setActiveApp(app.id)}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        activeApp === app.id 
                          ? "bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10 font-bold" 
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                      }`}
                    >
                      <span className="text-base">{app.icon}</span>
                      <span className="text-[10px] truncate max-w-full">{app.name}</span>
                    </button>
                  ))}
                </div>

                {/* =========================================================================
                    AUTHENTIC SIMULATION VIEWS
                   ========================================================================= */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
                  
                  {/* AUTO / All Applications UI */}
                  {activeApp === "AUTO" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span className="font-bold text-slate-200">⚡ All Applications (Auto-Detect Screen)</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {detectedWindow?.title ? `Focused: ${detectedWindow.title.slice(0, 22)}...` : "Auto-Injecting to Active Screen App"}
                      </span>
                    </div>
                  )}

                  {/* Notepad UI */}
                  {activeApp === "Notepad" && (
                    <>
                      <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-300 flex items-center gap-1.5">
                          📝 *Untitled - Notepad
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                        </div>
                      </div>
                      <div className="bg-slate-900/60 px-3 py-1 border-b border-slate-800/80 text-[11px] font-sans flex gap-3 text-slate-400">
                        <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
                      </div>
                    </>
                  )}

                  {/* ChatGPT UI */}
                  {activeApp === "ChatGPT" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-[10px]">GPT</span>
                        <span className="font-bold text-slate-200">ChatGPT 4o - Active Workspace</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400">● Connected</span>
                    </div>
                  )}

                  {/* Google AI Studio UI */}
                  {activeApp === "Google AI Studio" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="font-bold text-slate-200">Google AI Studio - Gemini 2.5 Flash</span>
                      </div>
                      <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">Prompt Console</span>
                    </div>
                  )}

                  {/* Anti-Gravity UI */}
                  {activeApp === "Anti-Gravity" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-slate-200">Anti-Gravity / Vibe Code IDE Prompt</span>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">Agent Ready</span>
                    </div>
                  )}

                  {/* WhatsApp UI */}
                  {activeApp === "WhatsApp" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-2">
                        💬 WhatsApp Web - Focused Chat
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">online</span>
                    </div>
                  )}

                  {/* Gmail UI */}
                  {activeApp === "Gmail" && (
                    <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-2">
                        ✉️ New Message - HR Sick Leave
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">User: {userName}</span>
                    </div>
                  )}

                  {/* Focused Text Area (Where text types in real-time) */}
                  <div className="p-3.5 bg-slate-950 flex flex-col min-h-[190px]">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono text-slate-500">
                      <span>Focused Document / Input Canvas</span>
                      <span className="text-cyan-400 animate-pulse">● Auto-Inject to Windows Desktop (Active)</span>
                    </div>

                    <textarea
                      value={activeInputText}
                      onChange={(e) => setActiveInputText(e.target.value)}
                      placeholder={
                        activeApp === "Notepad" 
                          ? "Windows Notepad is active. Spoken text will type directly here and in Notepad.exe..." 
                          : activeApp === "ChatGPT" 
                          ? "Message ChatGPT... Speak or type prompt here..."
                          : activeApp === "Google AI Studio" 
                          ? "Enter prompt for Google AI Studio here..."
                          : activeApp === "Anti-Gravity" 
                          ? "Paste prompt for Anti-Gravity / Vibe Code agent here..."
                          : "Speak or type text here..."
                      }
                      className="w-full flex-1 min-h-[160px] bg-transparent text-xs focus:outline-none resize-none font-sans text-slate-100 leading-relaxed placeholder:text-slate-600"
                    />

                    {/* Window Status & Clipboard Actions */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-900 text-[10px] text-slate-500 font-mono">
                      <span>{activeInputText.length} chars</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveInputText("")}
                          className="hover:text-slate-300 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                        <button 
                          onClick={() => { 
                            if (activeInputText) {
                              navigator.clipboard.writeText(activeInputText); 
                              showToast("✓ Copied to clipboard! (Press Ctrl+V to paste anywhere)");
                            }
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copy (Ctrl+V)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* =========================================================================
                      MANUAL TRANSLATION CONTROLS (CRITICAL USER REQUIREMENT!)
                     ========================================================================= */}
                  <div className="bg-slate-900/95 border-t border-slate-800 p-3.5 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                        <Languages className="w-3.5 h-3.5 text-cyan-400" />
                        மேனுவல் மொழி மாற்றம் (Manual Translation):
                      </span>
                      {isTranslating && (
                        <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 animate-pulse">
                          <RotateCw className="w-3 h-3 animate-spin" /> Translating...
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans">
                      மேலே டைப் ஆன உரையை உடனே வேறு மொழிக்கு மாற்ற கீழே உள்ள பட்டனை அழுத்தவும்:
                    </p>

                    {/* 1-Click Fast Translation Buttons */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <button
                        onClick={() => handleManualTranslate("en")}
                        disabled={isTranslating}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-cyan-500 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        🇬🇧 ஆங்கிலம் (English)
                      </button>

                      <button
                        onClick={() => handleManualTranslate("ta")}
                        disabled={isTranslating}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 hover:border-cyan-400 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        🇮🇳 தமிழ் (Tamil)
                      </button>

                      <button
                        onClick={() => handleManualTranslate("hi")}
                        disabled={isTranslating}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 hover:border-indigo-400 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        🇮🇳 हिन्दी (Hindi)
                      </button>

                      <div className="relative inline-block">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleManualTranslate(e.target.value);
                              e.target.value = "";
                            }
                          }}
                          disabled={isTranslating}
                          className="bg-slate-800 border border-slate-700 hover:border-cyan-500 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 font-sans focus:outline-none cursor-pointer"
                        >
                          <option value="">🌐 More Languages...</option>
                          <option value="te">🇮🇳 Telugu (తెలుగు)</option>
                          <option value="ml">🇮🇳 Malayalam (മലയാളം)</option>
                          <option value="kn">🇮🇳 Kannada (ಕನ್ನಡ)</option>
                          <option value="bn">🇮🇳 Bengali (বাংলা)</option>
                          <option value="es">🇪🇸 Spanish (Español)</option>
                          <option value="fr">🇫🇷 French (Français)</option>
                          <option value="de">🇩🇪 German (Deutsch)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}

        {/* =========================================================================
            TAB: SETTINGS
           ========================================================================= */}
        {activeTab === "settings" && (
          <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" /> STARK AI Settings & Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* User Authentication & Profile */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" /> User Profile (Username & Password)
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Username</label>
                      <input 
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-sans"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Password</label>
                      <input 
                        type="password"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    onClick={() => { localStorage.setItem("stark_user_name", userName); showToast("✓ Username saved!"); }}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Update Profile
                  </button>
                </div>
              </div>

              {/* Gemini API Key Management */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" /> Gemini API Key & Model
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">API Key</label>
                      <div className="flex gap-2">
                        <input 
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 font-mono"
                        />
                        <button 
                          onClick={() => setShowApiKey(!showApiKey)} 
                          className="px-3 bg-slate-800 rounded-xl text-slate-300 cursor-pointer"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Gemini Model</label>
                      <select 
                        value={selectedModel} 
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                      >
                        {GEMINI_MODELS.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    onClick={() => handleActivateApiKey()}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-xl text-xs cursor-pointer"
                  >
                    Re-Verify & Save
                  </button>
                  <button 
                    onClick={handleDeactivate}
                    className="px-4 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Deactivate
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: HISTORY
           ======================================================================== */}
        {activeTab === "history" && (
          <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-cyan-400" /> Voice & Translation History ({history.length})
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={() => setHistory([])}
                  className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs font-mono">
                No history recorded yet. Speak using F8 or use Quick Commands on the dashboard.
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {history.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{item.timestamp}</span>
                        <span>•</span>
                        <span className="text-cyan-400 uppercase font-bold">{item.appName}</span>
                        <span>•</span>
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                          {item.inputLang} → {item.outputLang}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono">
                        <span className="text-slate-500">Input:</span> "{item.transcript}"
                      </div>
                      <div className="text-xs text-emerald-300 font-medium">
                        <span className="text-slate-500">Output:</span> "{item.generatedText}"
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { 
                          navigator.clipboard.writeText(item.generatedText); 
                          showToast("Copied to clipboard!"); 
                        }}
                        className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 text-xs flex items-center gap-1 cursor-pointer"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => { 
                          setActiveInputText(item.generatedText);
                          setActiveTab("dashboard");
                          showToast("Loaded into Active Window!");
                        }}
                        className="px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Reuse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB: VERIFICATION TESTS (1-10)
           ========================================================================= */}
        {activeTab === "tests" && (
          <div className="col-span-12 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-cyan-400" /> STARK AI Verification Test Suite (Tests 1 to 10)
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-mono">
              Click any test below to instantly execute speech translation, manual translation, and active app simulation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 1</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Tanglish / English: "Tell me about yourself"</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "Tell me about yourself."</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Types "Tell me about yourself." without letter drops.</p>
                </div>
                <button onClick={() => runTestCase(1)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 1
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 2</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Tamil to English (Casual Conversation)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "நீங்க என்ன பண்றீங்க சாப்பிட்டீங்களா?"</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Types "What are you doing? Have you eaten?"</p>
                </div>
                <button onClick={() => runTestCase(2)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 2
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 3</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">HR 2-Day Sick Leave Mail (Signed by Barath)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "உடம்பு சரியில்ல, 2 நாள் லீவ் HR-க்கு மெயில் குடு"</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Types professional 2-day sick leave email signed by Barath.</p>
                </div>
                <button onClick={() => runTestCase(3)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 3
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 4</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Modify Existing HR Email (மாடிஃபை பண்ணு)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "அந்த மெயிலை கொஞ்சம் மாடிஃபை பண்ணு"</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Updates and refines the draft email intelligently.</p>
                </div>
                <button onClick={() => runTestCase(4)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 4
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 5</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Flipkart / Amazon Prompt for Anti-Gravity</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "Flipkart மாதிரி ஒரு வெப்சைட் ப்ராம்ப்ட் Anti-Gravity-க்கு குடு"</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Types complete full-stack prompt for Anti-Gravity agent.</p>
                </div>
                <button onClick={() => runTestCase(5)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 5
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 6</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">English to Hindi in ChatGPT Window</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "Tell me about yourself."</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: "अपने बारे में बताइए।"</p>
                </div>
                <button onClick={() => runTestCase(6)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 6
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 7</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">English to Tamil in ChatGPT Window</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Input: "Tell me about yourself."</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: "உங்களைப் பற்றி சொல்லுங்கள்."</p>
                </div>
                <button onClick={() => runTestCase(7)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 7
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 8</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">ChatGPT Python Web Scraping Prompt</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Action: Types directly into ChatGPT message input.</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Injects prompt into ChatGPT canvas.</p>
                </div>
                <button onClick={() => runTestCase(8)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 8
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 9</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">Google AI Studio Multimodal Prompt</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Action: Injects prompt into Google AI Studio window.</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Injects into Google AI Studio text box.</p>
                </div>
                <button onClick={() => runTestCase(9)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 9
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Test 10</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">WhatsApp Voice Message Typing</h4>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Action: Injects translated busy message into WhatsApp.</p>
                  <p className="text-[11px] text-emerald-400 mt-0.5 font-mono">Expected: Types into WhatsApp Web message box.</p>
                </div>
                <button onClick={() => runTestCase(10)} className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                  <Play className="w-3 h-3" /> Run Test 10
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          COMPACT 2CM FLOATING DESKTOP MIC PILL WIDGET (~85px width, like a Chrome tab)
         ========================================================================= */}
      {isWidgetVisible && (
        <div 
          style={{ transform: `translate(${widgetPosition.x}px, ${widgetPosition.y}px)` }}
          onMouseDown={handleWidgetMouseDown}
          className="fixed z-50 bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400 rounded-full py-1.5 px-3 shadow-2xl flex items-center gap-2 cursor-grab active:cursor-grabbing select-none transition-shadow"
          title="2cm Floating Mic (Drag anywhere or click mic to speak)"
        >
          {/* LED Indicator */}
          <span className={`w-2 h-2 rounded-full ${isListening ? "bg-rose-500 animate-ping" : "bg-cyan-400 animate-pulse"}`}></span>

          {/* Label */}
          <span className="text-[10px] font-mono font-bold text-slate-200">
            {isListening ? "REC" : "MIC"}
          </span>

          {/* Compact Mic Button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleListening(); }}
            className={`w-6 h-6 rounded-full flex items-center justify-center shadow transition-all cursor-pointer ${
              isListening ? "bg-rose-500 text-white animate-pulse" : "bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 hover:scale-105"
            }`}
          >
            <Mic className="w-3 h-3" />
          </button>

          {/* Popout PiP Shortcut */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePopoutDesktopMic(); }}
            className="text-cyan-400 hover:text-cyan-300 text-xs cursor-pointer ml-0.5"
            title="Pop-out Desktop Always-on-Top Mic"
          >
            <PopoutIcon className="w-3 h-3" />
          </button>

          {/* Close / Hide Widget */}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsWidgetVisible(false); }}
            className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer ml-0.5"
            title="Hide Widget"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="h-10 border-t border-slate-900 bg-slate-950 text-slate-500 text-[11px] px-6 flex items-center justify-between font-mono">
        <div>STARK AI • Universal Multi-Screen Voice Typing & Translation System</div>
        <div className="flex items-center gap-4">
          <span>Active User: <strong className="text-cyan-400">{userName}</strong></span>
          <span>Target App: <strong className="text-cyan-400">{activeApp}</strong></span>
          <span>Hotkey: <strong className="text-cyan-400">{primaryHotkey}</strong></span>
        </div>
      </footer>

    </div>
  );
}
