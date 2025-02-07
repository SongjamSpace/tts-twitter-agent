import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

const app = initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_KEY)
  ),
  storageBucket: "nusic-vox-player.appspot.com",
});

const db = getFirestore(app);
const storage = getStorage(app);

const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export { db, storage, serverTimestamp };
