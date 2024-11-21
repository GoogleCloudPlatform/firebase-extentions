import {firestoreRef} from './helpers/firebase';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

/** Define our HTML elements */
const inputText = document.getElementById('input-message') as HTMLInputElement;
const sendBtnText = document.getElementById('send-msg-btn') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLInputElement;

/** Chat Styles */
const userMessageClass = 'p-2 text-sm text-white bg-blue-400 rounded-lg';
const aiMessageClass =
  'flex p-2 text-sm text-gray-700 bg-gray-200 rounded-lg my-2';
const aiLoadingClass = 'loader';

const collectionName = 'chat';

const addMessages = async (prompt: string, response: string | null) => {
  /** Add prompt message */
  const promptDiv = document.createElement('div');
  promptDiv.className = userMessageClass;
  promptDiv.innerHTML = `👤 ${prompt}`;
  messages.appendChild(promptDiv);

  /** Add response message */
  const messageDiv = document.createElement('div');
  messageDiv.className = aiMessageClass;
  messageDiv.innerHTML = `🤖: ${response || "<div class='loader' />"}`;
  messages.appendChild(messageDiv);
};

/** Create a Firebase query */
const collectionRef = collection(firestoreRef, collectionName);
const q = query(collectionRef, orderBy('createTime'));

onSnapshot(q, snapshot => {
  messages.innerHTML = '';

  snapshot.docs.forEach(change => {
    /** Get promot and response */
    const {prompt, response} = change.data();

    /** Set AI class */
    const aiClass = prompt ? aiMessageClass : aiLoadingClass;

    /** Append messages */
    addMessages(prompt, response);
  });
});

/** Wait for message, add a new document */
sendBtnText.addEventListener('click', async () => {
  /** Add placeholder messages */
  addMessages(inputText.value, null);

  /** Add a new Firestore document */
  await addDoc(collection(firestoreRef, collectionName), {
    prompt: inputText.value,
  });

  /** Clear text input */
  inputText.value = '';
});
