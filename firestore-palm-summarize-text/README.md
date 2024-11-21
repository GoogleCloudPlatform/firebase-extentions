# Summarize Text with PaLM API

**Author**: Google Cloud (**[https://cloud.google.com/](https://cloud.google.com/)**)

**Description**: Summarizes text in Firestore documents using PaLM API.



**Details**: This extension allows you to summarize a field in a Firestore document using the Vertex AI PaLM API.

On installation, you will need to specify the following information:

- **Firestore collection path:** The path to the Firestore collection that contains the documents to summarize.
- **Document field to summarize:** The name of the document field to summarize.
- **Target summary length (number of sentences):** The desired length of the summary in sentences.
- **Response field:** The name of the field in the document to store the summary.

This extension will listen to the specified collection for new document writes and execute the following logic:

1. Call the PaLM API to generate a summary of the document field.
2. Write the summary back to the triggering document in the response field.

### Use cases

This extension can be used for a variety of use cases, including:

- Summarizing customer feedback
- Abstracting long articles
- Condensing user-generated content

Here are some examples of how this extension can be used:

- An e-commerce platform could use this extension to automatically generate summaries of customer feedback, giving customers a quick overview of the feedback before they decide whether to read the full content.
- A news website could use this extension to summarize articles, helping readers decide whether they want to invest their time in reading the full article.
- A social media platform could use this extension to provide summaries of user-generated content, improving content discoverability and user engagement.

### Regenerating a response

Changing the state field of a completed document's status from `COMPLETED` to anything else will retrigger the extension for that document.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan. You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Firestore
- Cloud Functions (See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))
- Associated costs for using Vertex AI ([see their pricing](https://cloud.google.com/vertex-ai/pricing#generative_ai_models)) if you use this provider.

[Learn more about Firebase billing.](https://firebase.google.com/pricing)




**Configuration Parameters:**

* Collection Name: Path to the Firestore collection where messages will be generated.

* Text field: The field of the document containing text to summarize.

* Response Field: The field in the message document into which to put the response.

* Target Summary Length: Number of sentences you would like the summary to be.

* Maximum number of tokens: If you have selected the Vertex AI service as your PaLM API provider, this parameter will be used to set the max_tokens parameter in the Vertex API request. It should be an integer in the range [1,1024]. The default value for the extension is 1024.

* Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).



**Cloud Functions:**

* **generateSummary:** Listens to Firestore data writes to generate summaries.



**APIs Used**:

* aiplatform.googleapis.com (Reason: For access to the PaLM API if the Vertex AI PaLM provider is chosen.)



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added text.)

* aiplatform.user (Reason: Allows this extension to access the PaLM API via Vertex AI if this provider is chosen.)
