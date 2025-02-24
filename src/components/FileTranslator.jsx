import React, { useState, useEffect, useRef } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy, FaUpload, FaVolumeUp, FaPause, FaStop } from "react-icons/fa";
import mammoth from "mammoth";

const SUPPORTED_LANGUAGES = {
  en: "English", es: "Spanish", fr: "French", ja: "Japanese", zh: "Chinese",
  as: "Assamese", bn: "Bengali", bho: "Bhojpuri", doi: "Dogri", gu: "Gujarati",
  hi: "Hindi", kn: "Kannada", ks: "Kashmiri", kok: "Konkani", mai: "Maithili",
  ml: "Malayalam", mr: "Marathi", mni: "Manipuri", ne: "Nepali", or: "Odia",
  pa: "Punjabi", sa: "Sanskrit", sd: "Sindhi", ta: "Tamil", te: "Telugu", ur: "Urdu"
};

function FileTranslator() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [copied, setCopied] = useState({ extracted: false, translated: false });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeakingExtracted, setIsSpeakingExtracted] = useState(false);
  const [isSpeakingTranslated, setIsSpeakingTranslated] = useState(false);
  const [isPausedExtracted, setIsPausedExtracted] = useState(false);
  const [isPausedTranslated, setIsPausedTranslated] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const extractedAudioRef = useRef(new Audio());
  const translatedAudioRef = useRef(new Audio());

  useEffect(() => {
    if (translatedText) {
      revealText(translatedText, setDisplayedText);
    }
  }, [translatedText]);

  const revealText = (text, setDisplayText) => {
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
      }
    }, 40);
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
    setExtractedText("");
    setTranslatedText("");
    setDisplayedText("");
    setError("");
  };
  

  const extractText = async () => {
    if (!file) return;
    setIsLoading(true);
    setIsExtracting(true);
    setError("");
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await extractTextFromPDF(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        text = await extractTextFromDocx(file);
      }
      setExtractedText(text);
    } catch (error) {
      setError("Error extracting text. Try again.");
    } finally {
      setIsLoading(false);
      setIsExtracting(false);
    }
  };

  const extractTextFromPDF = async (pdfFile) => {
   try {
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY; // Use environment variable
      const apiEndpoint = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      const base64 = await convertToBase64(pdfFile); // Assuming this function is defined elsewhere

      const requestBody = {
        requests: [
          {
            image: {
              content: base64,
            },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      };

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vision API Error:', errorText); // Log the error
        throw new Error(`Text extraction failed. Vision API returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.responses || data.responses.length === 0 || !data.responses[0].fullTextAnnotation) {
        throw new Error("No text found in PDF");
      }
      const extractedText = data.responses[0].fullTextAnnotation.text;
      return extractedText;
    } catch (error) {
      console.error("Error in extractTextFromPDF:", error);
      setError(`Failed to extract text from PDF: ${error.message}`);
      return "";
    }
  };
  

  const extractTextFromDocx = async (docxFile) => {
    try {
      const arrayBuffer = await docxFile.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error("Error in extractTextFromDocx:", error);
      setError(`Failed to extract text from DOCX: ${error.message}`);
      return "";
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const translateText = async () => {
    if (!extractedText) return;
    setIsLoading(true);
    setIsTranslating(true);
    setError("");
    try {
      const translation = await translateToTargetLanguage(extractedText, targetLang);
      setTranslatedText(translation);
    } catch (error) {
      setError("Translation failed. Try again.");
    } finally {
      setIsLoading(false);
      setIsTranslating(false);
    }
  };

  const translateToTargetLanguage = async (text, targetLang) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY; // Use environment variable
      const apiEndpoint = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: text, target: targetLang }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Translation API Error:', errorText); // Log the error
        throw new Error(`Translation failed: ${errorText}`);
      }

      const data = await response.json();
      if (!data.data || !data.data.translations || data.data.translations.length === 0) {
        throw new Error("Invalid translation response: No translations found");
      }
      const translatedText = data.data.translations[0].translatedText;
      return translatedText;
    } catch (error) {
      console.error("Error in translateToTargetLanguage:", error);
      setError(`Translation failed: ${error.message}`);
      return "";
    }
  };
  

  const speak = async (text, lang, audioRef, setIsSpeaking, setIsPaused) => {
    if (!text) return;
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
    const apiEndpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const requestPayload = {
      input: { text },
      voice: {
        languageCode: lang,
        ssmlGender: "FEMALE"
      },
      audioConfig: {
        audioEncoding: "MP3"
      }
    };
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });
      if (!response.ok) throw new Error("Text-to-Speech request failed");
      const data = await response.json();
      const audioContent = data.audioContent;
      audioRef.current.src = `data:audio/mp3;base64,${audioContent}`;
      audioRef.current.play();
      setIsSpeaking(true);
      setIsPaused(false);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
    } catch (error) {
      console.error("Error in TTS:", error);
      setError("Failed to generate speech. Try again.");
    }
  };

  const pauseSpeech = (audioRef, setIsPaused, isSpeaking) => {
    if (isSpeaking) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopSpeech = (audioRef, setIsSpeaking, setIsPaused) => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="file-translator">
      <h2>File Translator</h2>
      <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} />
      <button onClick={extractText} disabled={!file || isLoading}>
        <FaUpload /> Extract
      </button>
      <button onClick={translateText} disabled={!extractedText || isLoading}>
        <FaUpload /> Translate
      </button>
      <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <option key={code} value={code}>{name}</option>
        ))}
      </select>
      <div className="text-display">
        <h3>Extracted Text:</h3>
        <textarea value={extractedText} readOnly />
        <CopyToClipboard text={extractedText} onCopy={() => setCopied({ ...copied, extracted: true })}>
          <button disabled={!extractedText}><FaCopy /> {copied.extracted ? "Copied!" : "Copy"}</button>
        </CopyToClipboard>
        {(isExtracting || extractedText) && (
          <div className="button-container">
            <button onClick={() => speak(extractedText, "en", extractedAudioRef, setIsSpeakingExtracted, setIsPausedExtracted)} disabled={isSpeakingExtracted}>
              <FaVolumeUp /> Speak
            </button>
            <button onClick={() => pauseSpeech(extractedAudioRef, setIsPausedExtracted)} disabled={!isSpeakingExtracted}>
              {isPausedExtracted ? <FaVolumeUp /> : <FaPause />} Pause
            </button>
            <button onClick={() => stopSpeech(extractedAudioRef, setIsSpeakingExtracted, setIsPausedExtracted)} disabled={!isSpeakingExtracted}>
              <FaStop /> Stop
            </button>
          </div>
        )}
      </div>
      <div className="text-display">
        <h3>Translated Text:</h3>
        <textarea value={displayedText} readOnly />
        <CopyToClipboard text={translatedText} onCopy={() => setCopied({ ...copied, translated: true })}>
          <button disabled={!translatedText}><FaCopy /> {copied.translated ? "Copied!" : "Copy"}</button>
        </CopyToClipboard>
        {(isTranslating || translatedText) && (
          <div className="button-container">
            <button onClick={() => speak(translatedText, targetLang, translatedAudioRef, setIsSpeakingTranslated, setIsPausedTranslated)} disabled={isSpeakingTranslated}>
              <FaVolumeUp /> Speak
            </button>
            <button onClick={() => pauseSpeech(translatedAudioRef, setIsPausedTranslated)} disabled={!isSpeakingTranslated}>
              {isPausedTranslated ? <FaVolumeUp /> : <FaPause />} Pause
            </button>
            <button onClick={() => stopSpeech(translatedAudioRef, setIsSpeakingTranslated, setIsPausedTranslated)} disabled={!isSpeakingTranslated}>
              <FaStop /> Stop
            </button>
          </div>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default FileTranslator;
