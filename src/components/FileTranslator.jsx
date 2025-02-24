import React, { useState, useEffect, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaUpload, FaVolumeUp, FaPause, FaStop } from "react-icons/fa";
import mammoth from "mammoth";
import Tesseract from 'tesseract.js';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const SUPPORTED_LANGUAGES = {
  // Indian Languages
  as: 'Assamese',
  bn: 'Bengali',
  brx: 'Bodo',
  doi: 'Dogri',
  gu: 'Gujarati',
  hi: 'Hindi',
  kn: 'Kannada',
  ks: 'Kashmiri',
  gom: 'Konkani',
  mai: 'Maithili',
  ml: 'Malayalam',
  mni: 'Manipuri (Meitei)',
  mr: 'Marathi',
  ne: 'Nepali',
  or: 'Odia',
  pa: 'Punjabi',
  sa: 'Sanskrit',
  sat: 'Santali',
  sd: 'Sindhi',
  ta: 'Tamil',
  te: 'Telugu',
  ur: 'Urdu',

  // Foreign Languages
  en: 'English',
  zh: 'Chinese (Mandarin)',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  ru: 'Russian',
  pt: 'Portuguese',
  de: 'German',
  ja: 'Japanese',
  ko: 'Korean',
  it: 'Italian',
  vi: 'Vietnamese',
  id: 'Indonesian',
  th: 'Thai',
  tr: 'Turkish',
  fa: 'Persian',
  pl: 'Polish'
};

const TTS_LANGUAGE_CODES = {
  // Indian Languages
  hi: { languageCode: "hi-IN", voiceName: "hi-IN-Wavenet-B" },
  bn: { languageCode: "bn-IN", voiceName: "bn-IN-Standard-B" },
  ta: { languageCode: "ta-IN", voiceName: "ta-IN-Standard-B" },
  te: { languageCode: "te-IN", voiceName: "te-IN-Standard-B" },
  mr: { languageCode: "mr-IN", voiceName: "mr-IN-Standard-B" },
  gu: { languageCode: "gu-IN", voiceName: "gu-IN-Standard-B" },
  kn: { languageCode: "kn-IN", voiceName: "kn-IN-Standard-B" },
  pa: { languageCode: "pa-IN", voiceName: "pa-IN-Standard-B" },
  ur: { languageCode: "ur-IN", voiceName: "ur-IN-Standard-B" },
  ml: { languageCode: "ml-IN", voiceName: "ml-IN-Standard-B" },

  // Foreign Languages
  en: { languageCode: "en-US", voiceName: "en-US-Wavenet-D" },
  es: { languageCode: "es-ES", voiceName: "es-ES-Wavenet-B" },
  fr: { languageCode: "fr-FR", voiceName: "fr-FR-Wavenet-B" },
  de: { languageCode: "de-DE", voiceName: "de-DE-Wavenet-B" },
  it: { languageCode: "it-IT", voiceName: "it-IT-Wavenet-A" },
  ja: { languageCode: "ja-JP", voiceName: "ja-JP-Wavenet-B" },
  ko: { languageCode: "ko-KR", voiceName: "ko-KR-Wavenet-B" },
  ru: { languageCode: "ru-RU", voiceName: "ru-RU-Wavenet-B" },
  zh: { languageCode: "cmn-CN", voiceName: "cmn-CN-Wavenet-B" },
  ar: { languageCode: "ar-XA", voiceName: "ar-XA-Wavenet-B" },
  pt: { languageCode: "pt-PT", voiceName: "pt-PT-Wavenet-A" },
  vi: { languageCode: "vi-VN", voiceName: "vi-VN-Wavenet-A" },
  id: { languageCode: "id-ID", voiceName: "id-ID-Wavenet-A" },
  th: { languageCode: "th-TH", voiceName: "th-TH-Wavenet-A" },
  tr: { languageCode: "tr-TR", voiceName: "tr-TR-Wavenet-A" },
  pl: { languageCode: "pl-PL", voiceName: "pl-PL-Wavenet-A" }
};

const getTTSLanguageConfig = (lang) => {
  return TTS_LANGUAGE_CODES[lang] || TTS_LANGUAGE_CODES['en'];
};

function FileTranslator() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [audioState, setAudioState] = useState({
    extracted: { isPlaying: false, isPaused: false },
    translated: { isPlaying: false, isPaused: false }
  });

  const extractedAudioRef = useRef(new Audio());
  const translatedAudioRef = useRef(new Audio());

  useEffect(() => {
    if (translatedText) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(translatedText.slice(0, i));
        i++;
        if (i > translatedText.length) clearInterval(intervalId);
      }, 40);
      return () => clearInterval(intervalId);
    }
  }, [translatedText]);

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    if (!validTypes.includes(uploadedFile.type)) {
      setError("Unsupported file format");
      return;
    }

    setFile(uploadedFile);
    setExtractedText("");
    setTranslatedText("");
    setDisplayedText("");
    setError("");
  };

  const extractText = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError("");

    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        text = await extractTextFromImage(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        text = await extractTextFromDocx(file);
      }
      setExtractedText(text);
    } catch (error) {
      setError(`Extraction failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromPDF = async (pdfFile) => {
    const reader = new FileReader();
    const arrayBuffer = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(pdfFile);
    });

    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  };

  const extractTextFromImage = async (imageFile) => {
    const { data: { text } } = await Tesseract.recognize(
      imageFile,
      'eng+chi_sim+fra+spa',
      { logger: info => console.log(info) }
    );
    return text;
  };

  const extractTextFromDocx = async (docxFile) => {
    const arrayBuffer = await docxFile.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const translateText = async () => {
    if (!extractedText) return;
    setIsProcessing(true);
    setError("");

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: extractedText,
            target: targetLang,
            format: 'text'
          })
        }
      );

      if (!response.ok) throw new Error('Translation failed');
      const { data } = await response.json();
      setTranslatedText(data.translations[0].translatedText);
    } catch (error) {
      setError(`Translation failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudio = async (text, type) => {
    const audioRef = type === 'extracted' ? extractedAudioRef : translatedAudioRef;
    const lang = type === 'extracted' ? 'en' : targetLang;

    try {
      const { languageCode, voiceName } = getTTSLanguageConfig(lang);
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode, name: voiceName, ssmlGender: 'MALE' },
            audioConfig: { audioEncoding: 'MP3' }
          })
        }
      );

      const { audioContent } = await response.json();
      audioRef.current.src = `data:audio/mp3;base64,${audioContent}`;
      audioRef.current.play();
      
      setAudioState(prev => ({
        ...prev,
        [type]: { ...prev[type], isPlaying: true, isPaused: false }
      }));

      audioRef.current.onended = () => {
        setAudioState(prev => ({
          ...prev,
          [type]: { ...prev[type], isPlaying: false, isPaused: false }
        }));
      };
    } catch (error) {
      setError(`Audio playback failed: ${error.message}`);
    }
  };

  const togglePause = (type) => {
    const audioRef = type === 'extracted' ? extractedAudioRef : translatedAudioRef;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setAudioState(prev => ({
        ...prev,
        [type]: { ...prev[type], isPaused: false }
      }));
    } else {
      audioRef.current.pause();
      setAudioState(prev => ({
        ...prev,
        [type]: { ...prev[type], isPaused: true }
      }));
    }
  };

  const stopAudio = (type) => {
    const audioRef = type === 'extracted' ? extractedAudioRef : translatedAudioRef;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAudioState(prev => ({
      ...prev,
      [type]: { isPlaying: false, isPaused: false }
    }));
  };

  return (
    <div className="file-translator">
      <h2>Document/Image Translator</h2>
      
      <div className="controls">
        <input
          type="file"
          accept=".pdf,.docx,image/*"
          onChange={handleFileUpload}
          disabled={isProcessing}
        />
        
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          disabled={isProcessing}
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>

        <button 
          onClick={extractText}
          disabled={!file || isProcessing}
        >
          <FaUpload /> {isProcessing ? 'Processing...' : 'Extract Text'}
        </button>

        <button
          onClick={translateText}
          disabled={!extractedText || isProcessing}
        >
          <FaUpload /> {isProcessing ? 'Translating...' : 'Translate'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="text-sections">
        <div className="text-section">
          <h3>Extracted Text:</h3>
          <textarea value={extractedText} readOnly />
          <div className="actions">
            <CopyToClipboard text={extractedText}>
              <button disabled={!extractedText}>
                <FaCopy /> Copy
              </button>
            </CopyToClipboard>
            
            <div className="audio-controls">
              <button
                onClick={() => handleAudio(extractedText, 'extracted')}
                disabled={!extractedText || audioState.extracted.isPlaying}
              >
                <FaVolumeUp />
              </button>
              <button
                onClick={() => togglePause('extracted')}
                disabled={!audioState.extracted.isPlaying}
              >
                {audioState.extracted.isPaused ? <FaVolumeUp /> : <FaPause />}
              </button>
              <button
                onClick={() => stopAudio('extracted')}
                disabled={!audioState.extracted.isPlaying}
              >
                <FaStop />
              </button>
            </div>
          </div>
        </div>

        <div className="text-section">
          <h3>Translated Text:</h3>
          <textarea value={displayedText} readOnly />
          <div className="actions">
            <CopyToClipboard text={translatedText}>
              <button disabled={!translatedText}>
                <FaCopy /> Copy
              </button>
            </CopyToClipboard>
            
            <div className="audio-controls">
              <button
                onClick={() => handleAudio(translatedText, 'translated')}
                disabled={!translatedText || audioState.translated.isPlaying}
              >
                <FaVolumeUp />
              </button>
              <button
                onClick={() => togglePause('translated')}
                disabled={!audioState.translated.isPlaying}
              >
                {audioState.translated.isPaused ? <FaVolumeUp /> : <FaPause />}
              </button>
              <button
                onClick={() => stopAudio('translated')}
                disabled={!audioState.translated.isPlaying}
              >
                <FaStop />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileTranslator;
