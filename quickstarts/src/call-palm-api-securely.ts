import {authRef, functionsRef} from './helpers/firebase';
import {signInAnonymously} from 'firebase/auth';
import {httpsCallable} from 'firebase/functions';

/** Define our HTML elements */
const inputText = document.getElementById('input-message') as HTMLInputElement;
const sendBtnText = document.getElementById('send-msg-btn') as HTMLInputElement;
const messages = document.getElementById('messages') as HTMLInputElement;
const modelsSelect = document.getElementById(
  'dropdownHover'
) as HTMLInputElement;

type GenerateTextResponseData = {
  candidates: {
    output: string;
  }[];
};

type GenerateTextResponse = {
  data: GenerateTextResponseData;
};

signInAnonymously(authRef).then(() => {
  console.log('Signed in anonymously');
});

/** Load models on load */
onload = () => {
  getModels().then(result => {
    const data = result.data as {models: string[]};
    const {models} = data;
    models.forEach(model => {
      const option = document.createElement('div');
      //@ts-ignore
      option.value = model.name;
      //@ts-ignore
      option.innerHTML = model.name;
      option.className = 'block px-4 py-2 hover:bg-gray-100';
      modelsSelect.appendChild(option);
    });
  });
};

async function sendMessage() {
  /** Run the secure function */
  //@ts-ignore
  const response: GenerateTextResponse = await postMessage({
    model: 'text-bison-001',
    method: 'generateText',
    prompt: {
      text: inputText.value,
    },
  });

  /** Add placeholder messages */
  const div = document.createElement('div');
  div.innerHTML = `🤖: ${response.data.candidates[0].output}`;

  /** Update UI */
  messages.innerHTML = '';
  messages.appendChild(div);
}

/** Select an AI model */
modelsSelect.addEventListener('click', async e => {
  console.log('event >>>>', e);
  const modelName = modelsSelect.value;
  const model = await getModel({model: modelName});
  const data = model.data as {model: string};
  const {model: modelData} = data;

  console.log('Model:', modelData);
});

const extName = 'ext-palm-secure-backend';
const postMessage = httpsCallable(functionsRef, `${extName}-post`);
const getModels = httpsCallable(functionsRef, `${extName}-getModels`);
const getModel = httpsCallable(functionsRef, `${extName}-getModel`);

/** Wait for message, add a new document */
sendBtnText.addEventListener('click', async () => await sendMessage());
