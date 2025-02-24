import React, { useState } from 'react';
import Translator from './components/Translator';
import FileTranslator from './components/FileTranslator';
import SignIn from './components/SignIn';
import Register from './components/Register';
import { FaHome, FaImage, FaSun, FaMoon, FaSignInAlt, FaUserPlus, FaSignOutAlt } from 'react-icons/fa';
import './themes.css';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState('translator');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-theme');
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const handleSignIn = () => {
    setIsLoggedIn(true);
    setCurrentView('fileTranslator');
  };

  const handleRegister = () => {
    setIsLoggedIn(true);
    setCurrentView('fileTranslator');
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentView('translator');
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
          {!isLoggedIn && (
            <>
              <button onClick={() => navigateTo('signin')} title="Sign In">
                <FaSignInAlt />
              </button>
              <button onClick={() => navigateTo('register')} title="Register">
                <FaUserPlus />
              </button>
            </>
          )}
          {isLoggedIn && (
            <button onClick={handleSignOut} title="Sign Out">
              <FaSignOutAlt />
            </button>
          )}
        </div>
      </header>

      <div className="container">
        {currentView === 'translator' && <Translator />}
        {currentView === 'fileTranslator' && <FileTranslator isLoggedIn={isLoggedIn} onAuthRequired={() => navigateTo('signin')} />}
        {currentView === 'signin' && <SignIn onSignIn={handleSignIn} onSwitchToRegister={() => navigateTo('register')} />}
        {currentView === 'register' && <Register onRegister={handleRegister} onSwitchToSignIn={() => navigateTo('signin')} />}
      </div>
    </div>
  );
}

export default App;
