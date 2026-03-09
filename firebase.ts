
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const getFirebaseConfig = () => {
  // Try to get from localStorage first (dynamic config from Profile)
  let cloudConfig = null;
  try {
    const saved = localStorage.getItem('si-lks-cloud-config');
    if (saved) cloudConfig = JSON.parse(saved);
  } catch (e) {
    console.error("Failed to parse cloud config from localStorage");
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || cloudConfig?.projectId;
  
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || cloudConfig?.apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId: projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || cloudConfig?.storageBucket || (projectId ? `${projectId}.firebasestorage.app` : undefined),
    appId: import.meta.env.VITE_FIREBASE_APP_ID || cloudConfig?.appId,
  };
};

const firebaseConfig = getFirebaseConfig();

// Initialize Firebase
const app = (getApps().length === 0 && firebaseConfig.apiKey) 
  ? initializeApp(firebaseConfig) 
  : (getApps().length > 0 ? getApp() : null);

export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

export const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!storage) throw new Error("Firebase Storage belum dikonfigurasi. Silakan atur API Key dan Project ID di menu Profil.");
  
  try {
    const storageRef = ref(storage, path);
    // Set metadata to help with CORS/Content-Type if needed
    const metadata = {
      contentType: file.type,
    };
    await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error("Error in uploadFile:", error);
    if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error("Gagal mengunggah ke Firebase: Batas waktu habis. Pastikan konfigurasi Storage Bucket benar dan CORS telah diatur di Firebase Console.");
    }
    throw error;
  }
};

export default app;
