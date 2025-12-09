import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyB0sujCMW7pwqaVJstP-7W00EpqdqQS1A8",
    authDomain: "sih-cc.firebaseapp.com",
    projectId: "sih-cc",
    storageBucket: "sih-cc.firebasestorage.app",
    messagingSenderId: "478006752056",
    appId: "1:478006752056:web:e2d07bfb9b91128a9647cd",
    measurementId: "G-ECD1Y6TQHE"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
