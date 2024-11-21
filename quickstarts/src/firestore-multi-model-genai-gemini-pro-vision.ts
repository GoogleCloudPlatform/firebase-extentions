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
const inputImage = document.getElementById('input-image') as HTMLInputElement;
const sendBtnText = document.getElementById('send-msg-btn') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLInputElement;

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
  if (output) {
    const messageDiv = document.createElement('div');
    messageDiv.className = aiMessageClass;
    messageDiv.innerHTML = `🤖: ${output}`;
    messages.appendChild(messageDiv);
  }
};

/** Create a Firebase query */
const collectionRef = collection(firestoreRef, collectionName);
const q = query(collectionRef, orderBy('status.startTime'));

onSnapshot(q, snapshot => {
  messages.innerHTML = '';

  snapshot.docs.forEach(change => {
    /** Get promot and output */
    const {instruction, output} = change.data();

    /** Append messages */
    addMessages(instruction, output);
  });
});

/** Wait for message, add a new document */
sendBtnText.addEventListener('click', async () => {
  /** Add placeholder messages */
  addMessages(inputText.value, null);

  /** Add a new Firestore document */
  await addDoc(collection(firestoreRef, collectionName), {
    instruction: inputText.value,
    image: inputImage.value,
  });

  /** Clear text input */
  inputText.value = '';
});
