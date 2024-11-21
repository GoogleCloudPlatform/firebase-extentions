import {getDownloadURL, ref, uploadBytes} from 'firebase/storage';
import {storageRef} from './helpers/firebase';

const videoUpload = document.getElementById('video-upload') as HTMLInputElement;
const uploadButton = document.getElementById('upload-button') as HTMLElement;

let file: File;

videoUpload.addEventListener('change', (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  const files = target?.files || [];
  file = files[0];
  if (file) {
    uploadButton.removeAttribute('disabled');
  }
});

uploadButton.addEventListener('click', () => {
  uploadButton.setAttribute('disabled', 'true');

  uploadVideo();
});

const uploadVideo = () => {
  const videoRef = ref(storageRef, `/video_annotation_input/${file.name}`);

  uploadBytes(videoRef, file).then(snapshot => {
    console.log('Uploaded a blob or file!');
    uploadButton.removeAttribute('disabled');
  });

  setTimeout(fetchVideoJson, 20000);
};

const fetchVideoJson = () => {
  const labelsFileRef = ref(
    storageRef,
    `/video_annotation_output/${file.name}.json`
  );

  getDownloadURL(labelsFileRef)
    .then(url => {
      console.log(url);
      fetch(url)
        .then(response => response.json())
        .then(data => {
          console.log('Labeled data:', data);
          const annotations = data.annotation_results[0];
          const labels = annotations.segment_label_annotations;
          labels.forEach((label: any) => {
            console.log(`${label.entity.description} occurs!`);
          });
        });
    })
    .catch(function (error) {
      console.error('Upload failed:', error);
    });
};
