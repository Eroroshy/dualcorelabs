import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import {
    getReactNativePersistence,
    initializeAuth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB7C61rjBeGkuzEL0bUh6LDw4i8vW4ZTtg",
  authDomain: "kinetic-4e2b7.firebaseapp.com",
  projectId: "kinetic-4e2b7",
  storageBucket: "kinetic-4e2b7.firebasestorage.app",
  messagingSenderId: "1012857364904",
  appId: "1:1012857364904:web:3a5d2b73bf9305c44fbd9d",
};

export const app = initializeApp(firebaseConfig);

// 🔥 AUTH CON PERSISTENCIA REAL
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});