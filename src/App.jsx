import React, { useState } from 'react';
import Translator from './components/Translator';
import FileTranslator from './components/FileTranslator';
import { FaHome, FaImage, FaSun, FaMoon } from 'react-icons/fa';
import './themes.css';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('translator');

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-theme');
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <header className="header">
        <h2 className="brand">My Translator</h2>
        <div className="nav-buttons">
          <button onClick={() => navigateTo('translator')} title="Home">
            <FaHome />
          </button>
          <button onClick={() => navigateTo('fileTranslator')} title="File Translator">
            <FaImage />
          </button>
          <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </header>

      <div className="container">
        {currentView === 'translator' && <Translator />}
        {currentView === 'fileTranslator' && <FileTranslator />}
      </div>
    </div>
  );
}

export default App;
