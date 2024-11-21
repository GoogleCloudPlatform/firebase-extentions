import {authRef, functionsRef, firestoreRef} from './helpers/firebase';
import {httpsCallable} from 'firebase/functions';
import {signInAnonymously} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';

/** declare types */
type Datapoint = {
  datapointId: string;
  datapoint: number[];
};

type Neighbor = {
  datapoint: Datapoint;
  distance: number;
};

type VertexResponse = {
  neighbors: Neighbor[];
  datapoint: Datapoint;
};

type DocumentResponse = {
  name: string;
};

/** Define our HTML elements */
const inputText = document.getElementById('search-input') as HTMLInputElement;
const searchBtnText = document.getElementById('search-btn') as HTMLInputElement;
const results = document.getElementById('search-results') as HTMLInputElement;

const collectionName = 'countries';

signInAnonymously(authRef).then(() => {
  console.log('Signed in anonymously');
});

const search = httpsCallable(
  functionsRef,
  `ext-firestore-semantic-search-queryIndex`
);

searchBtnText.addEventListener('click', async () => {
  await search({query: [inputText.value]}).then(async result => {
    //@ts-ignore
    const {nearestNeighbors} = result.data.data as VertexResponse;

    for (const neighbor of nearestNeighbors[0].neighbors) {
      /** Get the document based on the collection name and document Id */
      const documentRef = doc(
        firestoreRef,
        collectionName,
        neighbor.datapoint.datapointId
      );

      /** Load the document snapshot */
      const documentSnap = await getDoc(documentRef);

      /** Extract the field data */
      const {name} = documentSnap.data() as DocumentResponse;

      /** Add to the list of data */
      const newDiv = document.createElement('div');

      /** Add the name to the element */
      newDiv.append(name);

      /** Update the search results */
      results.append(newDiv);
    }
  });
});
