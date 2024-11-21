import {functionsRef, authRef, storageRef} from './helpers/firebase';
import {signInAnonymously} from 'firebase/auth';
import {httpsCallable} from 'firebase/functions';
import {ref, getDownloadURL} from 'firebase/storage';

/** Sign in annonomously */
signInAnonymously(authRef).then(() => {
  console.log('Signed in anonymously');
});

/** Get the search onCall function */
const extName = 'ext-storage-reverse-image-search-queryIndex';
const search = httpsCallable(functionsRef, extName);

/** Define our HTML elements */
const fileUpload = document.getElementById('image-upload') as HTMLInputElement;

/** Listen for file upload */
fileUpload.addEventListener('change', async e => {
  //@ts-ignore
  const file = e.target?.files[0];

  /** Load the file into the file reader */
  const reader = new FileReader();

  /** Set the onLoad function */

  reader.onload = async e => {
    //@ts-ignore
    const base64Image = e.target.result as string;
    const base64Data = base64Image.split(',')[1];

    /** Run the search function */
    const {data: response} = await search({query: [base64Data]});

    /** Download the images */
    //@ts-ignore
    const {neighbors} = response?.data?.nearestNeighbors[0];

    for await (const neighbor of neighbors) {
      const {datapointId} = neighbor.datapoint;

      const objectRef = ref(storageRef, datapointId);
      const objectUrl = await getDownloadURL(objectRef);

      /** Update the UI */
      console.log(objectUrl);
    }
  };

  /** Read in the data */
  reader.readAsDataURL(file);
});
