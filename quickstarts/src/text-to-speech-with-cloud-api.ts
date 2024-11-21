import {StorageReference, getDownloadURL, ref} from 'firebase/storage';
import {storageRef, firestoreRef} from './helpers/firebase';
import {addDoc, collection, doc, onSnapshot} from 'firebase/firestore';

const inputText = document.getElementById('input-text') as HTMLInputElement;
const submitText = document.getElementById('submit-text') as HTMLElement;

inputText.addEventListener('input', (e: any) => {
  const value = e.target?.value.trim();
  if (value) {
    submitText.removeAttribute('disabled');
  }
});

submitText.addEventListener('click', handleSubmitText);

function handleSubmitText() {
  if (inputText?.value?.trim()) {
    submitText.setAttribute('disabled', 'true');
    const textToConvert = inputText.value.trim();

    submitTextToFirestore(textToConvert);
  }
}
function submitTextToFirestore(text: string) {
  const textCollectionRef = collection(firestoreRef, 'text_to_speech');

  addDoc(textCollectionRef, {text: text})
    .then(docRef => {
      setTimeout(() => {
        // listenForConvertedAudio(docRef.id);
        downloadConvertedAudio(docRef.id);
      }, 5000);

      console.log('Text submitted for conversion:', docRef.id);
    })
    .catch(error => {
      submitText.removeAttribute('disabled');
      console.log('Error submitting text:', error);
    });
}

function downloadConvertedAudio(docId: string) {
  const audioFileRef = ref(storageRef, `text_to_speech/${docId}.mp3`);
  downloadUrl(audioFileRef);
}

function listenForConvertedAudio(docId: string) {
  const docRef = doc(firestoreRef, 'text_to_speech', docId);

  onSnapshot(docRef, doc => {
    if (doc.exists()) {
      const audioPath = doc.data().audioPath;
      console.log(doc.data());
      // Retrieve and play the audio file using the path
      const audioFileRef = ref(storageRef, audioPath);
      if (audioPath) {
        downloadUrl(audioFileRef);
      }
    }
  });
}

function downloadUrl(fileRef: StorageReference) {
  getDownloadURL(fileRef)
    .then(url => {
      const audio = new Audio(url);
      audio
        .play()
        .then(() => console.log('Audio playback started'))
        .catch(e => {
          submitText.removeAttribute('disabled');
          console.error('Error playing audio:', e);
        })
        .finally(() => submitText.removeAttribute('disabled'));
    })
    .catch(error => {
      submitText.removeAttribute('disabled');
      console.error('Error loading audio file:', error);
    });
}
