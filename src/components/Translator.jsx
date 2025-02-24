import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaVolumeUp } from 'react-icons/fa';

// Supported languages for translation
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

// TTS configurations (male voices where available)
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

function Translator() {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [copied, setCopied] = useState(false);
  const [buttonText, setButtonText] = useState('Translate');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (translatedText) {
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(translatedText.slice(0, i));
        i++;
        if (i > translatedText.length) clearInterval(intervalId);
      }, 50);
      return () => clearInterval(intervalId);
    }
  }, [translatedText]);

  const handleTranslate = async () => {
    if (!text.trim()) return;

    setButtonText('Translating...');
    setErrorMessage('');
    setTranslatedText('');
    setDisplayedText('');

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: text,
            source: sourceLang === 'auto' ? undefined : sourceLang,
            target: targetLang,
            format: 'text'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Translation failed: ${errorData.error.message}`);
      }

      const { data } = await response.json();
      const translation = data.translations[0];
      setTranslatedText(translation.translatedText);

      if (sourceLang === 'auto' && translation.detectedSourceLanguage) {
        setDetectedLanguage(translation.detectedSourceLanguage);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setErrorMessage(error.message || 'Translation failed. Please try again.');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setButtonText('Translate');
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = async () => {
    if (!translatedText) {
      setErrorMessage('Please translate text first.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      const { languageCode, voiceName } = getTTSLanguageConfig(targetLang);

      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text: translatedText },
            voice: {
              languageCode,
              name: voiceName,
              ssmlGender: 'MALE'
            },
            audioConfig: { audioEncoding: 'MP3' }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
      }

      const { audioContent } = await response.json();
      new Audio(`data:audio/mp3;base64,${audioContent}`).play();
    } catch (error) {
      console.error('TTS error:', error);
      setErrorMessage(error.message.includes('Voice') 
        ? `Voice not available for ${SUPPORTED_LANGUAGES[targetLang]}`
        : 'Speech generation failed');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  return (
    <div className="card">
      <div className="select-row">
        <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
          <option value="auto">Auto-detect</option>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {detectedLanguage && sourceLang === 'auto' && (
        <div className="detected-language">
          Detected: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
        </div>
      )}

      <div className="textarea-row">
        <div className="textarea-container">
          <textarea
            placeholder="Enter text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="output-container">
          <textarea
            placeholder="Translation"
            value={displayedText}
            readOnly
          />
          <div className="action-buttons">
            <CopyToClipboard text={translatedText} onCopy={handleCopy}>
              <button className="copy-icon" disabled={!translatedText}>
                <FaCopy />
                {copied && <span className="tooltip">Copied!</span>}
              </button>
            </CopyToClipboard>
            <button className="speak-icon" onClick={speak} disabled={!translatedText}>
              <FaVolumeUp />
            </button>
          </div>
        </div>
      </div>

      <button
        className="translate-btn"
        onClick={handleTranslate}
        disabled={buttonText !== 'Translate'}
      >
        {buttonText}
      </button>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
}

export default Translator;
