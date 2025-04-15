// import React, { useState, useEffect } from 'react';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
// import { FaCopy, FaVolumeUp } from 'react-icons/fa';
// import OpenAI from 'openai';

// // Supported languages (same as original)
// const SUPPORTED_LANGUAGES = {
//   as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri', gu: 'Gujarati',
//   hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri', gom: 'Konkani', mai: 'Maithili',
//   ml: 'Malayalam', mni: 'Manipuri (Meitei)', mr: 'Marathi', ne: 'Nepali',
//   or: 'Odia', pa: 'Punjabi', sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi',
//   ta: 'Tamil', te: 'Telugu', ur: 'Urdu', en: 'English', zh: 'Chinese (Mandarin)',
//   es: 'Spanish', fr: 'French', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
//   de: 'German', ja: 'Japanese', ko: 'Korean', it: 'Italian', vi: 'Vietnamese',
//   id: 'Indonesian', th: 'Thai', tr: 'Turkish', fa: 'Persian', pl: 'Polish'
// };

// // TTS configurations (same as before)
// const getTTSLanguageConfig = (lang) => {
//   const browserLangMap = {
//     hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
//     kn: 'kn-IN', pa: 'pa-IN', ur: 'ur-IN', ml: 'ml-IN', en: 'en-US', es: 'es-ES',
//     fr: 'fr-FR', de: 'de-DE', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU',
//     zh: 'zh-CN', ar: 'ar-SA', pt: 'pt-PT', vi: 'vi-VN', id: 'id-ID', th: 'th-TH',
//     tr: 'tr-TR', pl: 'pl-PL'
//   };
//   return { languageCode: browserLangMap[lang] || 'en-US' };
// };

// // Initialize OpenRouter client for DeepSeek R1
// const openRouter = new OpenAI({
//   baseURL: 'https://openrouter.ai/api/v1',
//   apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
//   dangerouslyAllowBrowser: true // Development only
// });

// function Translator() {
//   const [text, setText] = useState('');
//   const [translatedText, setTranslatedText] = useState('');
//   const [displayedText, setDisplayedText] = useState('');
//   const [sourceLang, setSourceLang] = useState('auto');
//   const [targetLang, setTargetLang] = useState('es');
//   const [detectedLanguage, setDetectedLanguage] = useState('');
//   const [copied, setCopied] = useState(false);
//   const [buttonText, setButtonText] = useState('Translate');
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     if (translatedText) {
//       let i = 0;
//       const intervalId = setInterval(() => {
//         setDisplayedText(translatedText.slice(0, i));
//         i++;
//         if (i > translatedText.length) clearInterval(intervalId);
//       }, 50);
//       return () => clearInterval(intervalId);
//     }
//   }, [translatedText]);

//   const handleTranslate = async () => {
//     if (!text.trim()) return;

//     setButtonText('Translating...');
//     setErrorMessage('');
//     setTranslatedText('');
//     setDisplayedText('');

//     try {
//       // Refined prompt to request only the translation
//       const prompt = sourceLang === 'auto'
//         ? `Translate "${text}" to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`
//         : `Translate "${text}" from ${SUPPORTED_LANGUAGES[sourceLang]} to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`;

//       const completion = await openRouter.chat.completions.create({
//         model: 'deepseek/deepseek-r1:free',
//         messages: [
//           { role: 'system', content: 'You are a translator that returns only the translated text.' },
//           { role: 'user', content: prompt }
//         ]
//       });

//       let translated = completion.choices[0].message.content.trim();
//       // Fallback parsing in case extra text remains (e.g., markdown or explanations)
//       const match = translated.match(/^(.*?)$/m); // Take the first line as the translation
//       translated = match ? match[1] : translated;
//       setTranslatedText(translated);

//       // Handle auto-detection
//       if (sourceLang === 'auto') {
//         const detectPrompt = `Detect the language of "${text}". Return only the language name, nothing else.`;
//         const detectResponse = await openRouter.chat.completions.create({
//           model: 'deepseek/deepseek-r1:free',
//           messages: [
//             { role: 'system', content: 'You are a language detector that returns only the language name.' },
//             { role: 'user', content: detectPrompt }
//           ]
//         });
//         const detected = detectResponse.choices[0].message.content.trim().toLowerCase();
//         const langCode = Object.keys(SUPPORTED_LANGUAGES).find(
//           code => SUPPORTED_LANGUAGES[code].toLowerCase() === detected
//         );
//         if (langCode) setDetectedLanguage(langCode);
//       }
//     } catch (error) {
//       console.error('Translation error:', error);
//       let userMessage = 'Translation failed. Please try again.';
//       if (error.status === 402) {
//         userMessage = 'Rate limit exceeded on OpenRouter free tier. Try again later.';
//       } else if (error.message) {
//         userMessage = `Translation failed: ${error.message}`;
//       }
//       setErrorMessage(userMessage);
//       setTimeout(() => setErrorMessage(''), 4000);
//     } finally {
//       setButtonText('Translate');
//     }
//   };

//   const handleCopy = () => {
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const speak = async () => {
//     if (!translatedText) {
//       setErrorMessage('Please translate text first.');
//       setTimeout(() => setErrorMessage(''), 4000);
//       return;
//     }

//     try {
//       const { languageCode } = getTTSLanguageConfig(targetLang);
//       const utterance = new SpeechSynthesisUtterance(translatedText);
//       utterance.lang = languageCode;
//       window.speechSynthesis.speak(utterance);
//     } catch (error) {
//       console.error('TTS error:', error);
//       setErrorMessage('Speech generation failed or not supported for this language');
//       setTimeout(() => setErrorMessage(''), 4000);
//     }
//   };

//   return (
//     <div className="card">
//       <div className="select-row">
//         <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
//           <option value="auto">Auto-detect</option>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
        
//         <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
//       </div>

//       {detectedLanguage && sourceLang === 'auto' && (
//         <div className="detected-language">
//           Detected: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
//         </div>
//       )}

//       <div className="textarea-row">
//         <div className="textarea-container">
//           <textarea
//             placeholder="Enter text"
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//         </div>
//         <div className="output-container">
//           <textarea
//             placeholder="Translation"
//             value={displayedText}
//             readOnly
//           />
//           <div className="action-buttons">
//             <CopyToClipboard text={translatedText} onCopy={handleCopy}>
//               <button className="copy-icon" disabled={!translatedText}>
//                 <FaCopy />
//                 {copied && <span className="tooltip">Copied!</span>}
//               </button>
//             </CopyToClipboard>
//             <button className="speak-icon" onClick={speak} disabled={!translatedText}>
//               <FaVolumeUp />
//             </button>
//           </div>
//         </div>
//       </div>

//       <button
//         className="translate-btn"
//         onClick={handleTranslate}
//         disabled={buttonText !== 'Translate'}
//       >
//         {buttonText}
//       </button>

//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//     </div>
//   );
// }

// export default Translator;
// import React, { useState, useEffect } from 'react';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
// import { FaCopy, FaVolumeUp } from 'react-icons/fa';
// import OpenAI from 'openai';

// // Supported languages
// const SUPPORTED_LANGUAGES = {
//   as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri', gu: 'Gujarati',
//   hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri', gom: 'Konkani', mai: 'Maithili',
//   ml: 'Malayalam', mni: 'Manipuri (Meitei)', mr: 'Marathi', ne: 'Nepali',
//   or: 'Odia', pa: 'Punjabi', sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi',
//   ta: 'Tamil', te: 'Telugu', ur: 'Urdu', en: 'English', zh: 'Chinese (Mandarin)',
//   es: 'Spanish', fr: 'French', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
//   de: 'German', ja: 'Japanese', ko: 'Korean', it: 'Italian', vi: 'Vietnamese',
//   id: 'Indonesian', th: 'Thai', tr: 'Turkish', fa: 'Persian', pl: 'Polish'
// };

// // Language codes for Google TTS
// const getTTSLanguageConfig = (lang) => {
//   const googleLangMap = {
//     hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
//     kn: 'kn-IN', pa: 'pa-IN', ml: 'ml-IN', en: 'en-US', es: 'es-ES', fr: 'fr-FR',
//     de: 'de-DE', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU', zh: 'cmn-CN',
//     ar: 'ar-XA', pt: 'pt-PT', vi: 'vi-VN', id: 'id-ID', th: 'th-TH', tr: 'tr-TR',
//     pl: 'pl-PL'
//   };
//   const languageCode = googleLangMap[lang] || 'en-US';
//   return {
//     languageCode,
//     voiceName: `${languageCode}-Standard-A` // Using Standard-A voice as default
//   };
// };

// // Initialize OpenRouter client
// const openRouter = new OpenAI({
//   baseURL: 'https://openrouter.ai/api/v1',
//   apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// function Translator() {
//   const [text, setText] = useState('');
//   const [translatedText, setTranslatedText] = useState('');
//   const [displayedText, setDisplayedText] = useState('');
//   const [sourceLang, setSourceLang] = useState('auto');
//   const [targetLang, setTargetLang] = useState('es');
//   const [detectedLanguage, setDetectedLanguage] = useState('');
//   const [copied, setCopied] = useState(false);
//   const [buttonText, setButtonText] = useState('Translate');
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     if (translatedText) {
//       let i = 0;
//       const intervalId = setInterval(() => {
//         setDisplayedText(translatedText.slice(0, i));
//         i++;
//         if (i > translatedText.length) clearInterval(intervalId);
//       }, 50);
//       return () => clearInterval(intervalId);
//     }
//   }, [translatedText]);

//   const handleTranslate = async () => {
//     if (!text.trim()) return;

//     setButtonText('Translating...');
//     setErrorMessage('');
//     setTranslatedText('');
//     setDisplayedText('');

//     try {
//       const prompt = sourceLang === 'auto'
//         ? `Translate "${text}" to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`
//         : `Translate "${text}" from ${SUPPORTED_LANGUAGES[sourceLang]} to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`;

//       const completion = await openRouter.chat.completions.create({
//         model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
//         messages: [
//           { role: 'system', content: 'You are a translator that returns only the translated text.' },
//           { role: 'user', content: prompt }
//         ]
//       });

//       let translated = completion.choices[0].message.content.trim();
//       const match = translated.match(/^(.*?)$/m);
//       translated = match ? match[1] : translated;
//       setTranslatedText(translated);

//       if (sourceLang === 'auto') {
//         const detectPrompt = `Detect the language of "${text}". Return only the language name, nothing else.`;
//         const detectResponse = await openRouter.chat.completions.create({
//           model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
//           messages: [
//             { role: 'system', content: 'You are a language detector that returns only the language name.' },
//             { role: 'user', content: detectPrompt }
//           ]
//         });
//         const detected = detectResponse.choices[0].message.content.trim().toLowerCase();
//         const langCode = Object.keys(SUPPORTED_LANGUAGES).find(
//           code => SUPPORTED_LANGUAGES[code].toLowerCase() === detected
//         );
//         if (langCode) setDetectedLanguage(langCode);
//       }
//     } catch (error) {
//       console.error('Translation error:', error);
//       let userMessage = 'Translation failed. Please try again.';
//       if (error.status === 402) userMessage = 'Rate limit exceeded on OpenRouter free tier. Try again later.';
//       else if (error.message) userMessage = `Translation failed: ${error.message}`;
//       setErrorMessage(userMessage);
//       setTimeout(() => setErrorMessage(''), 4000);
//     } finally {
//       setButtonText('Translate');
//     }
//   };

//   const handleCopy = () => {
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const speak = async () => {
//     if (!translatedText) {
//       setErrorMessage('Please translate text first.');
//       setTimeout(() => setErrorMessage(''), 4000);
//       return;
//     }

//     try {
//       const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
//       const { languageCode, voiceName } = getTTSLanguageConfig(targetLang);

//       const response = await fetch(
//         `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             input: { text: translatedText },
//             voice: {
//               languageCode,
//               name: voiceName,
//               ssmlGender: 'MALE'
//             },
//             audioConfig: { audioEncoding: 'MP3' }
//           })
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error.message);
//       }

//       const { audioContent } = await response.json();
//       new Audio(`data:audio/mp3;base64,${audioContent}`).play();
//     } catch (error) {
//       console.error('TTS error:', error);
//       setErrorMessage(error.message.includes('Voice') 
//         ? `Voice not available for ${SUPPORTED_LANGUAGES[targetLang]}`
//         : 'Speech generation failed');
//       setTimeout(() => setErrorMessage(''), 4000);
//     }
//   };

//   return (
//     <div className="card">
//       <div className="select-row">
//         <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
//           <option value="auto">Auto-detect</option>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
        
//         <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
//       </div>

//       {detectedLanguage && sourceLang === 'auto' && (
//         <div className="detected-language">
//           Detected: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
//         </div>
//       )}

//       <div className="textarea-row">
//         <div className="textarea-container">
//           <textarea
//             placeholder="Enter text"
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//         </div>
//         <div className="output-container">
//           <textarea
//             placeholder="Translation"
//             value={displayedText}
//             readOnly
//           />
//           <div className="action-buttons">
//             <CopyToClipboard text={translatedText} onCopy={handleCopy}>
//               <button className="copy-icon" disabled={!translatedText}>
//                 <FaCopy />
//                 {copied && <span className="tooltip">Copied!</span>}
//               </button>
//             </CopyToClipboard>
//             <button className="speak-icon" onClick={speak} disabled={!translatedText}>
//               <FaVolumeUp />
//             </button>
//           </div>
//         </div>
//       </div>

//       <button
//         className="translate-btn"
//         onClick={handleTranslate}
//         disabled={buttonText !== 'Translate'}
//       >
//         {buttonText}
//       </button>

//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//     </div>
//   );
// }

// export default Translator;
// // import React, { useState, useEffect } from 'react';
// // import { CopyToClipboard } from 'react-copy-to-clipboard';
// // import { FaCopy, FaVolumeUp } from 'react-icons/fa';
// // import OpenAI from 'openai';

// // // Supported languages (same as original)
// // const SUPPORTED_LANGUAGES = {
// //   as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri', gu: 'Gujarati',
// //   hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri', gom: 'Konkani', mai: 'Maithili',
// //   ml: 'Malayalam', mni: 'Manipuri (Meitei)', mr: 'Marathi', ne: 'Nepali',
// //   or: 'Odia', pa: 'Punjabi', sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi',
// //   ta: 'Tamil', te: 'Telugu', ur: 'Urdu', en: 'English', zh: 'Chinese (Mandarin)',
// //   es: 'Spanish', fr: 'French', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
// //   de: 'German', ja: 'Japanese', ko: 'Korean', it: 'Italian', vi: 'Vietnamese',
// //   id: 'Indonesian', th: 'Thai', tr: 'Turkish', fa: 'Persian', pl: 'Polish'
// // };

// // // TTS configurations (same as before)
// // const getTTSLanguageConfig = (lang) => {
// //   const browserLangMap = {
// //     hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
// //     kn: 'kn-IN', pa: 'pa-IN', ur: 'ur-IN', ml: 'ml-IN', en: 'en-US', es: 'es-ES',
// //     fr: 'fr-FR', de: 'de-DE', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU',
// //     zh: 'zh-CN', ar: 'ar-SA', pt: 'pt-PT', vi: 'vi-VN', id: 'id-ID', th: 'th-TH',
// //     tr: 'tr-TR', pl: 'pl-PL'
// //   };
// //   return { languageCode: browserLangMap[lang] || 'en-US' };
// // };

// // // Initialize OpenRouter client for DeepSeek R1
// // const openRouter = new OpenAI({
// //   baseURL: 'https://openrouter.ai/api/v1',
// //   apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
// //   dangerouslyAllowBrowser: true // Development only
// // });

// // function Translator() {
// //   const [text, setText] = useState('');
// //   const [translatedText, setTranslatedText] = useState('');
// //   const [displayedText, setDisplayedText] = useState('');
// //   const [sourceLang, setSourceLang] = useState('auto');
// //   const [targetLang, setTargetLang] = useState('es');
// //   const [detectedLanguage, setDetectedLanguage] = useState('');
// //   const [copied, setCopied] = useState(false);
// //   const [buttonText, setButtonText] = useState('Translate');
// //   const [errorMessage, setErrorMessage] = useState('');

// //   useEffect(() => {
// //     if (translatedText) {
// //       let i = 0;
// //       const intervalId = setInterval(() => {
// //         setDisplayedText(translatedText.slice(0, i));
// //         i++;
// //         if (i > translatedText.length) clearInterval(intervalId);
// //       }, 50);
// //       return () => clearInterval(intervalId);
// //     }
// //   }, [translatedText]);

// //   const handleTranslate = async () => {
// //     if (!text.trim()) return;

// //     setButtonText('Translating...');
// //     setErrorMessage('');
// //     setTranslatedText('');
// //     setDisplayedText('');

// //     try {
// //       // Refined prompt to request only the translation
// //       const prompt = sourceLang === 'auto'
// //         ? `Translate "${text}" to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`
// //         : `Translate "${text}" from ${SUPPORTED_LANGUAGES[sourceLang]} to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`;

// //       const completion = await openRouter.chat.completions.create({
// //         model: 'deepseek/deepseek-r1:free',
// //         messages: [
// //           { role: 'system', content: 'You are a translator that returns only the translated text.' },
// //           { role: 'user', content: prompt }
// //         ]
// //       });

// //       let translated = completion.choices[0].message.content.trim();
// //       // Fallback parsing in case extra text remains (e.g., markdown or explanations)
// //       const match = translated.match(/^(.*?)$/m); // Take the first line as the translation
// //       translated = match ? match[1] : translated;
// //       setTranslatedText(translated);

// //       // Handle auto-detection
// //       if (sourceLang === 'auto') {
// //         const detectPrompt = `Detect the language of "${text}". Return only the language name, nothing else.`;
// //         const detectResponse = await openRouter.chat.completions.create({
// //           model: 'deepseek/deepseek-r1:free',
// //           messages: [
// //             { role: 'system', content: 'You are a language detector that returns only the language name.' },
// //             { role: 'user', content: detectPrompt }
// //           ]
// //         });
// //         const detected = detectResponse.choices[0].message.content.trim().toLowerCase();
// //         const langCode = Object.keys(SUPPORTED_LANGUAGES).find(
// //           code => SUPPORTED_LANGUAGES[code].toLowerCase() === detected
// //         );
// //         if (langCode) setDetectedLanguage(langCode);
// //       }
// //     } catch (error) {
// //       console.error('Translation error:', error);
// //       let userMessage = 'Translation failed. Please try again.';
// //       if (error.status === 402) {
// //         userMessage = 'Rate limit exceeded on OpenRouter free tier. Try again later.';
// //       } else if (error.message) {
// //         userMessage = `Translation failed: ${error.message}`;
// //       }
// //       setErrorMessage(userMessage);
// //       setTimeout(() => setErrorMessage(''), 4000);
// //     } finally {
// //       setButtonText('Translate');
// //     }
// //   };

// //   const handleCopy = () => {
// //     setCopied(true);
// //     setTimeout(() => setCopied(false), 2000);
// //   };

// //   const speak = async () => {
// //     if (!translatedText) {
// //       setErrorMessage('Please translate text first.');
// //       setTimeout(() => setErrorMessage(''), 4000);
// //       return;
// //     }

// //     try {
// //       const { languageCode } = getTTSLanguageConfig(targetLang);
// //       const utterance = new SpeechSynthesisUtterance(translatedText);
// //       utterance.lang = languageCode;
// //       window.speechSynthesis.speak(utterance);
// //     } catch (error) {
// //       console.error('TTS error:', error);
// //       setErrorMessage('Speech generation failed or not supported for this language');
// //       setTimeout(() => setErrorMessage(''), 4000);
// //     }
// //   };

// //   return (
// //     <div className="card">
// //       <div className="select-row">
// //         <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
// //           <option value="auto">Auto-detect</option>
// //           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
// //             <option key={code} value={code}>{name}</option>
// //           ))}
// //         </select>
        
// //         <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
// //           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
// //             <option key={code} value={code}>{name}</option>
// //           ))}
// //         </select>
// //       </div>

// //       {detectedLanguage && sourceLang === 'auto' && (
// //         <div className="detected-language">
// //           Detected: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
// //         </div>
// //       )}

// //       <div className="textarea-row">
// //         <div className="textarea-container">
// //           <textarea
// //             placeholder="Enter text"
// //             value={text}
// //             onChange={(e) => setText(e.target.value)}
// //           />
// //         </div>
// //         <div className="output-container">
// //           <textarea
// //             placeholder="Translation"
// //             value={displayedText}
// //             readOnly
// //           />
// //           <div className="action-buttons">
// //             <CopyToClipboard text={translatedText} onCopy={handleCopy}>
// //               <button className="copy-icon" disabled={!translatedText}>
// //                 <FaCopy />
// //                 {copied && <span className="tooltip">Copied!</span>}
// //               </button>
// //             </CopyToClipboard>
// //             <button className="speak-icon" onClick={speak} disabled={!translatedText}>
// //               <FaVolumeUp />
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       <button
// //         className="translate-btn"
// //         onClick={handleTranslate}
// //         disabled={buttonText !== 'Translate'}
// //       >
// //         {buttonText}
// //       </button>

// //       {errorMessage && <div className="error-message">{errorMessage}</div>}
// //     </div>
// //   );
// // }

// // export default Translator;
// import React, { useState, useEffect } from 'react';
// import { CopyToClipboard } from 'react-copy-to-clipboard';
// import { FaCopy, FaVolumeUp } from 'react-icons/fa';
// import OpenAI from 'openai';

// // Supported languages
// const SUPPORTED_LANGUAGES = {
//   as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri', gu: 'Gujarati',
//   hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri', gom: 'Konkani', mai: 'Maithili',
//   ml: 'Malayalam', mni: 'Manipuri (Meitei)', mr: 'Marathi', ne: 'Nepali',
//   or: 'Odia', pa: 'Punjabi', sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi',
//   ta: 'Tamil', te: 'Telugu', ur: 'Urdu', en: 'English', zh: 'Chinese (Mandarin)',
//   es: 'Spanish', fr: 'French', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
//   de: 'German', ja: 'Japanese', ko: 'Korean', it: 'Italian', vi: 'Vietnamese',
//   id: 'Indonesian', th: 'Thai', tr: 'Turkish', fa: 'Persian', pl: 'Polish'
// };

// // Language codes for Google TTS
// const getTTSLanguageConfig = (lang) => {
//   const googleLangMap = {
//     hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
//     kn: 'kn-IN', pa: 'pa-IN', ml: 'ml-IN', en: 'en-US', es: 'es-ES', fr: 'fr-FR',
//     de: 'de-DE', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU', zh: 'cmn-CN',
//     ar: 'ar-XA', pt: 'pt-PT', vi: 'vi-VN', id: 'id-ID', th: 'th-TH', tr: 'tr-TR',
//     pl: 'pl-PL'
//   };
//   const languageCode = googleLangMap[lang] || 'en-US';
//   return {
//     languageCode,
//     voiceName: `${languageCode}-Standard-A` // Using Standard-A voice as default
//   };
// };

// // Initialize OpenRouter client
// const openRouter = new OpenAI({
//   baseURL: 'https://openrouter.ai/api/v1',
//   apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
//   dangerouslyAllowBrowser: true
// });

// function Translator() {
//   const [text, setText] = useState('');
//   const [translatedText, setTranslatedText] = useState('');
//   const [displayedText, setDisplayedText] = useState('');
//   const [sourceLang, setSourceLang] = useState('auto');
//   const [targetLang, setTargetLang] = useState('es');
//   const [detectedLanguage, setDetectedLanguage] = useState('');
//   const [copied, setCopied] = useState(false);
//   const [buttonText, setButtonText] = useState('Translate');
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     if (translatedText) {
//       let i = 0;
//       const intervalId = setInterval(() => {
//         setDisplayedText(translatedText.slice(0, i));
//         i++;
//         if (i > translatedText.length) clearInterval(intervalId);
//       }, 50);
//       return () => clearInterval(intervalId);
//     }
//   }, [translatedText]);

//   const handleTranslate = async () => {
//     if (!text.trim()) return;

//     setButtonText('Translating...');
//     setErrorMessage('');
//     setTranslatedText('');
//     setDisplayedText('');

//     try {
//       const prompt = sourceLang === 'auto'
//         ? `Translate "${text}" to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`
//         : `Translate "${text}" from ${SUPPORTED_LANGUAGES[sourceLang]} to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`;

//       const completion = await openRouter.chat.completions.create({
//         model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
//         messages: [
//           { role: 'system', content: 'You are a translator that returns only the translated text.' },
//           { role: 'user', content: prompt }
//         ]
//       });

//       let translated = completion.choices[0].message.content.trim();
//       const match = translated.match(/^(.*?)$/m);
//       translated = match ? match[1] : translated;
//       setTranslatedText(translated);

//       if (sourceLang === 'auto') {
//         const detectPrompt = `Detect the language of "${text}". Return only the language name, nothing else.`;
//         const detectResponse = await openRouter.chat.completions.create({
//           model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
//           messages: [
//             { role: 'system', content: 'You are a language detector that returns only the language name.' },
//             { role: 'user', content: detectPrompt }
//           ]
//         });
//         const detected = detectResponse.choices[0].message.content.trim().toLowerCase();
//         const langCode = Object.keys(SUPPORTED_LANGUAGES).find(
//           code => SUPPORTED_LANGUAGES[code].toLowerCase() === detected
//         );
//         if (langCode) setDetectedLanguage(langCode);
//       }
//     } catch (error) {
//       console.error('Translation error:', error);
//       let userMessage = 'Translation failed. Please try again.';
//       if (error.status === 402) userMessage = 'Rate limit exceeded on OpenRouter free tier. Try again later.';
//       else if (error.message) userMessage = `Translation failed: ${error.message}`;
//       setErrorMessage(userMessage);
//       setTimeout(() => setErrorMessage(''), 4000);
//     } finally {
//       setButtonText('Translate');
//     }
//   };

//   const handleCopy = () => {
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const speak = async () => {
//     if (!translatedText) {
//       setErrorMessage('Please translate text first.');
//       setTimeout(() => setErrorMessage(''), 4000);
//       return;
//     }

//     try {
//       const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
//       const { languageCode, voiceName } = getTTSLanguageConfig(targetLang);

//       const response = await fetch(
//         `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
//         {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             input: { text: translatedText },
//             voice: {
//               languageCode,
//               name: voiceName,
//               ssmlGender: 'MALE'
//             },
//             audioConfig: { audioEncoding: 'MP3' }
//           })
//         }
//       );

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error.message);
//       }

//       const { audioContent } = await response.json();
//       new Audio(`data:audio/mp3;base64,${audioContent}`).play();
//     } catch (error) {
//       console.error('TTS error:', error);
//       setErrorMessage(error.message.includes('Voice') 
//         ? `Voice not available for ${SUPPORTED_LANGUAGES[targetLang]}`
//         : 'Speech generation failed');
//       setTimeout(() => setErrorMessage(''), 4000);
//     }
//   };

//   return (
//     <div className="card">
//       <div className="select-row">
//         <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
//           <option value="auto">Auto-detect</option>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
        
//         <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
//           {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
//             <option key={code} value={code}>{name}</option>
//           ))}
//         </select>
//       </div>

//       {detectedLanguage && sourceLang === 'auto' && (
//         <div className="detected-language">
//           Detected: {SUPPORTED_LANGUAGES[detectedLanguage] || detectedLanguage}
//         </div>
//       )}

//       <div className="textarea-row">
//         <div className="textarea-container">
//           <textarea
//             placeholder="Enter text"
//             value={text}
//             onChange={(e) => setText(e.target.value)}
//           />
//         </div>
//         <div className="output-container">
//           <textarea
//             placeholder="Translation"
//             value={displayedText}
//             readOnly
//           />
//           <div className="action-buttons">
//             <CopyToClipboard text={translatedText} onCopy={handleCopy}>
//               <button className="copy-icon" disabled={!translatedText}>
//                 <FaCopy />
//                 {copied && <span className="tooltip">Copied!</span>}
//               </button>
//             </CopyToClipboard>
//             <button className="speak-icon" onClick={speak} disabled={!translatedText}>
//               <FaVolumeUp />
//             </button>
//           </div>
//         </div>
//       </div>

//       <button
//         className="translate-btn"
//         onClick={handleTranslate}
//         disabled={buttonText !== 'Translate'}
//       >
//         {buttonText}
//       </button>

//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//     </div>
//   );
// }

// export default Translator;
import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaVolumeUp } from 'react-icons/fa';
import OpenAI from 'openai';

// Supported languages
const SUPPORTED_LANGUAGES = {
  as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri', gu: 'Gujarati',
  hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri', gom: 'Konkani', mai: 'Maithili',
  ml: 'Malayalam', mni: 'Manipuri (Meitei)', mr: 'Marathi', ne: 'Nepali',
  or: 'Odia', pa: 'Punjabi', sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi',
  ta: 'Tamil', te: 'Telugu', ur: 'Urdu', en: 'English', zh: 'Chinese (Mandarin)',
  es: 'Spanish', fr: 'French', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
  de: 'German', ja: 'Japanese', ko: 'Korean', it: 'Italian', vi: 'Vietnamese',
  id: 'Indonesian', th: 'Thai', tr: 'Turkish', fa: 'Persian', pl: 'Polish'
};

// Language codes for Google TTS
const getTTSLanguageConfig = (lang) => {
  const googleLangMap = {
    hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN', gu: 'gu-IN',
    kn: 'kn-IN', pa: 'pa-IN', ml: 'ml-IN', en: 'en-US', es: 'es-ES', fr: 'fr-FR',
    de: 'de-DE', it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', ru: 'ru-RU', zh: 'cmn-CN',
    ar: 'ar-XA', pt: 'pt-PT', vi: 'vi-VN', id: 'id-ID', th: 'th-TH', tr: 'tr-TR',
    pl: 'pl-PL'
  };
  const languageCode = googleLangMap[lang] || 'en-US';
  return {
    languageCode,
    voiceName: `${languageCode}-Standard-A` // Using Standard-A voice as default
  };
};

// Initialize OpenRouter client with your new API key
const openRouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY, // Your new key
  dangerouslyAllowBrowser: true
});

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
      const prompt = sourceLang === 'auto'
        ? `Translate "${text}" to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`
        : `Translate "${text}" from ${SUPPORTED_LANGUAGES[sourceLang]} to ${SUPPORTED_LANGUAGES[targetLang]}. Return only the translated text, nothing else.`;

      const completion = await openRouter.chat.completions.create({
        model: 'google/gemini-pro', // Assuming Gemini 2.5 Pro; adjust if exact ID differs
        messages: [
          { role: 'system', content: 'You are a translator that returns only the translated text.' },
          { role: 'user', content: prompt }
        ]
      });

      let translated = completion.choices[0].message.content.trim();
      const match = translated.match(/^(.*?)$/m);
      translated = match ? match[1] : translated;
      setTranslatedText(translated);

      if (sourceLang === 'auto') {
        const detectPrompt = `Detect the language of "${text}". Return only the language name, nothing else.`;
        const detectResponse = await openRouter.chat.completions.create({
          model: 'google/gemini-pro', // Same model for consistency
          messages: [
            { role: 'system', content: 'You are a language detector that returns only the language name.' },
            { role: 'user', content: detectPrompt }
          ]
        });
        const detected = detectResponse.choices[0].message.content.trim().toLowerCase();
        const langCode = Object.keys(SUPPORTED_LANGUAGES).find(
          code => SUPPORTED_LANGUAGES[code].toLowerCase() === detected
        );
        if (langCode) setDetectedLanguage(langCode);
      }
    } catch (error) {
      console.error('Translation error:', error);
      let userMessage = 'Translation failed. Please try again.';
      if (error.status === 402) userMessage = 'Rate limit exceeded on OpenRouter free tier. Try again later.';
      else if (error.status === 400) userMessage = 'Invalid request. Check model availability.';
      else if (error.message) userMessage = `Translation failed: ${error.message}`;
      setErrorMessage(userMessage);
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
