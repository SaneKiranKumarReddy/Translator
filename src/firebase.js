import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIlTYI4vi6wk-TazAphQJfnoF9vhZXHOE",
  authDomain: "translator-3a4a9.firebaseapp.com",
  projectId: "translator-3a4a9",
  storageBucket: "translator-3a4a9.appspot.com",  // Corrected
  messagingSenderId: "802066693977",
  appId: "1:802066693977:web:9acd2c08b59f91e381d648"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
