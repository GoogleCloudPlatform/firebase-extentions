import {firestoreRef, authRef} from './helpers/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import {signInAnonymously} from 'firebase/auth';

/** Sign in annonymously */
await signInAnonymously(authRef).then(() => {
  console.log('Signed in anonymously', authRef.currentUser?.uid);
});

/** Define our HTML elements */
const inputText = document.getElementById('input-message') as HTMLInputElement;
const sendBtnText = document.getElementById('send-msg-btn') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLInputElement;

/** Define a star element */
function createStar(isActive = true) {
  const svgElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg'
  );

  /** Set active colors */
  isActive && svgElement.setAttribute('class', 'w-4 h-4 text-yellow-300 ms-1');
  !isActive &&
    svgElement.setAttribute('class', 'w-4 h-4 text-gray-300 text-gray-500');

  svgElement.setAttribute('aria-hidden', 'true');
  svgElement.setAttribute('fill', 'currentColor');
  svgElement.setAttribute('viewBox', '0 0 22 20');

  const pathElement = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  pathElement.setAttribute(
    'd',
    'M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z'
  );

  svgElement.appendChild(pathElement);

  return svgElement;
}

function generateStarRating(element: HTMLDivElement, count: number) {
  const messageDiv = document.createElement('div');
  messageDiv.className = aiMessageClass;

  for (let i = 0; i < 5; i++) {
    const isActive = i < count;
    messageDiv.appendChild(createStar(isActive));
  }

  element.appendChild(messageDiv);
}

/** Chat Styles */
const userMessageClass = 'p-2 text-sm text-white bg-blue-400 rounded-lg';
const aiMessageClass =
  'flex p-2 text-sm text-gray-700 bg-gray-200 rounded-lg my-2';
const aiLoadingClass = 'loader';

const collectionName = `generate`;

const addMessages = async (comment: string, output: string | null) => {
  /** Add comment message */
  const commentDiv = document.createElement('div');
  commentDiv.className = userMessageClass;
  commentDiv.innerHTML = `👤 ${comment}`;
  messages.appendChild(commentDiv);

  /** Add output message */
  output && generateStarRating(messages, parseInt(output || '0'));
};

/** Create a Firebase query */
const collectionRef = collection(firestoreRef, collectionName);
const q = query(collectionRef, orderBy('status.startTime'));

onSnapshot(q, snapshot => {
  messages.innerHTML = '';

  snapshot.docs.forEach(change => {
    /** Get promot and output */
    const {comment, output} = change.data();

    /** Append messages */
    addMessages(comment, output);
  });
});

/** Wait for message, add a new document */
sendBtnText.addEventListener('click', async () => {
  /** Add placeholder messages */
  addMessages(inputText.value, null);

  /** Add a new Firestore document */
  await addDoc(collection(firestoreRef, collectionName), {
    comment: inputText.value,
  });

  /** Clear text input */
  inputText.value = '';
});
