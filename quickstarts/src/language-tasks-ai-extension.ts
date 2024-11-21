import {firestoreRef} from './helpers/firebase';
import {addDoc, collection, doc} from 'firebase/firestore';
import {getDoc} from 'firebase/firestore';

const inputText = document.getElementById('input-text') as HTMLInputElement;
const submitText = document.getElementById('submit-text') as HTMLElement;
type Review = {
  text: string;
  rating: number; // from 1 to 5
};

// Example array of review objects
const reviews: Review[] = [
  // {
  // 	text: 'I really enjoyed the water bottle, I just wish they carried this in a larger size as I go for long hikes. But overall the aesthetic, manufacturing, and functional design are great for what I needed.',
  // 	rating: 4, // Default rating set to 4
  // },
];

inputText.addEventListener('input', (e: any) => {
  const value = e.target?.value.trim();
  if (value) submitText.removeAttribute('disabled');
});

submitText.addEventListener('click', handleSubmitText);

function handleSubmitText() {
  /** Check if valid input */
  if (inputText?.value?.trim()) {
    /** Disable the sumbit button */
    submitText.setAttribute('disabled', 'true');

    /** Submit for review */
    submitTextToFirestore(inputText.value.trim());
  }
}

function submitTextToFirestore(text: string) {
  const textCollectionRef = collection(firestoreRef, 'generate');

  addDoc(textCollectionRef, {comment: text})
    .then(docRef => {
      setTimeout(() => {
        // listenForConvertedAudio(docRef.id);
        getCommentAndOutput(docRef.id);
      }, 5000);

      console.log('Text submitted for conversion:', docRef.id);
    })
    .catch(error => {
      submitText.removeAttribute('disabled');
      console.log('Error submitting text:', error);
    });
}

function getCommentAndOutput(docId: string) {
  const docRef = doc(firestoreRef, 'generate', docId);

  getDoc(docRef)
    .then(doc => {
      if (doc.exists()) {
        const comment = doc.data().comment;
        const output = doc.data().output;

        console.log('Comment:', comment);
        console.log('Output:', output);

        // Create a new review entry with the comment and output as values
        const newReview: Review = {
          text: comment,
          rating: output || 3, // Use output as rating, default to 3 if output is not available
        };

        // Add the new review to the reviews array
        reviews.push(newReview);

        // Render the updated reviews
        document.getElementById('reviews-container')!.innerHTML =
          renderReviews(reviews);
      } else {
        console.log('Document not found');
      }
    })
    .catch(error => {
      console.log('Error getting document:', error);
    });
}

// Function to create a single star element
function createStar(
  id: string,
  isChecked: boolean,
  isHovered: boolean
): string {
  const checkedClass = isChecked ? 'text-yellow-500' : '';
  const hoverClass = isHovered
    ? 'hover:text-yellow-500'
    : 'hover:text-gray-400';
  return `<label for="${id}" class="cursor-pointer ${checkedClass} ${hoverClass}">★</label>`;
}

// Function to render the star rating for each review
function renderStars(
  reviewIndex: number,
  currentRating: number,
  hoverRating: number
): string {
  let starsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const starId = `star-${reviewIndex}-${i}`;
    const isChecked = i <= currentRating;
    const isHovered = i <= hoverRating;
    starsHtml += createStar(starId, isChecked, isHovered);
  }
  return starsHtml;
}

// Function to render the full list of reviews
function renderReviews(reviews: Review[]): string {
  return reviews
    .map(
      (review, index) => `
    <div class="bg-white border rounded-lg shadow p-4 mb-4">
      <p class="mb-3">${review.text}</p>
      <div class="flex" onmouseover="handleMouseOver(event, ${index})" onmouseout="handleMouseOut(${index})">
        ${renderStars(index, review.rating, 0)}
      </div>
    </div>
  `
    )
    .join('');
}
