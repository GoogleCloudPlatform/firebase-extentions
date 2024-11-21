import {getDownloadURL, getMetadata, ref, uploadBytes} from 'firebase/storage';
import {firestoreRef, storageRef} from './helpers/firebase';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

const imageUpload = document.getElementById('image-upload') as HTMLInputElement;
const uploadButton = document.getElementById('upload-button') as HTMLElement;

let file: File;

imageUpload.addEventListener('change', (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const files = target?.files || [];
  file = files[0];
  if (file) {
    uploadButton.removeAttribute('disabled');
  }
});

uploadButton.addEventListener('click', () => {
  uploadButton.setAttribute('disabled', 'true');

  uploadImage();
});

let uploadedFullPath: string;

const uploadImage = () => {
  const imageRef = ref(storageRef, `/users/photos/${file.name}`);

  uploadBytes(imageRef, file).then(snapshot => {
    console.log('Uploaded a blob or file!');
    uploadButton.removeAttribute('disabled');
    uploadedFullPath = `gs://${snapshot.ref.bucket}/${snapshot.ref.fullPath}`;

    console.log('Uploaded file path:', uploadedFullPath);
    // listen to changes in the Firestore database
    listenForExtractedText();
  });

  setTimeout(() => {
    getImageLabel(uploadedFullPath);
  }, 20000);
};

const getImageLabel = (imageFullPath: string) => {
  if (imageFullPath) {
    const labelsQuery = query(
      collection(firestoreRef, 'imageLabels'),
      where('file', '==', imageFullPath)
    );

    getDocs(labelsQuery).then(querySnapshot => {
      querySnapshot.forEach(doc => {
        console.log('Labeled data:', doc.data());
        // Process or display the labeled data as needed
      });
    });
  }
};

const listenForExtractedText = () => {
  const docRef = collection(firestoreRef, 'imageLabels');
  const labelQuery = query(docRef, where('file', '==', uploadedFullPath));

  onSnapshot(labelQuery, querySnapshot => {
    querySnapshot.forEach(doc => {
      if (doc.exists()) {
        console.log('Updated text:', doc.data());

        // Update UI accordingly
      }
    });
  });
};
