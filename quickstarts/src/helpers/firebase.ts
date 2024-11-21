import {initializeApp} from 'firebase/app';
import {getAnalytics} from 'firebase/analytics';
import {getStorage} from 'firebase/storage';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getFunctions} from 'firebase/functions';

const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storageRef = getStorage(app);
const firestoreRef = getFirestore(app);
const analyticsRef = getAnalytics(app);
const functionsRef = getFunctions(app);
const authRef = getAuth(app);

export {storageRef, analyticsRef, firestoreRef, authRef, functionsRef, app};
