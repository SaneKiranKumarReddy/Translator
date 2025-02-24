import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaVolumeUp } from 'react-icons/fa';

const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  ja: 'Japanese',
  zh: 'Chinese',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  mr: 'Marathi',
  ml: 'Malayalam',
  ur: 'Urdu'
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
        if (i > translatedText.length) {
          clearInterval(intervalId);
        }
      }, 50);
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
      const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

      // Translation Request (Auto-detect source)
      const translateResponse = await fetch(translateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang === 'auto' ? undefined : sourceLang,
          target: targetLang,
          format: 'text',
        }),
      });

      if (!translateResponse.ok) {
        const errorData = await translateResponse.json();
        throw new Error(`Translation request failed: ${translateResponse.status} - ${errorData.error.message}`);
      }

      const translateData = await translateResponse.json();

      if (translateData?.data?.translations?.length > 0) {
        const translation = translateData.data.translations[0];
        setTranslatedText(translation.translatedText);

        // Set detected language if source was "auto"
        if (sourceLang === 'auto' && translation.detectedSourceLanguage) {
          setDetectedLanguage(translation.detectedSourceLanguage);
        }
      } else {
        throw new Error('Invalid response from translation service');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
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
      const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: translatedText },
          voice: { languageCode: targetLang, ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error.message.includes('language is not supported')) {
          throw new Error(`The language "${SUPPORTED_LANGUAGES[targetLang]}" is not supported for text-to-speech.`);
        }
        throw new Error(`Text-to-speech request failed: ${response.status} - ${errorData.error.message}`);
      }

      const { audioContent } = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
      audio.play();

    } catch (error) {
      console.error('Error in text-to-speech:', error);
      setErrorMessage(error.message || 'Failed to generate speech. Please try again.');
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
          Detected Language: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
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

      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

export default Translator;
