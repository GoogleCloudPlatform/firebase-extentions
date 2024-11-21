# Language Tasks with PaLM API

**Author**: Google Cloud (**[https://cloud.google.com](https://cloud.google.com)**)

**Description**: Performs AI/ML tasks on text, customizable with prompt engineering, using PaLM API and Firestore.



**Details**: This extension allows you to perform language tasks using the PaLM API, a custom prompt, and Firestore.

On installation, you will be asked to provide the following information:

- **PaLM API Provider** This extension makes use of the PaLM large language model. There is a choice of provider for this API. See the section below for more details.
- **Prompt:** This is the text that you want the PaLM API to generate a response for. It can be free-form text or it can use handlebars variables to substitute values from the Firestore document.
- **Firestore collection path:** This is the path to the Firestore collection that contains the documents that you want to perform the language task on.
- **Response field:** This is the name of the field in the Firestore document where you want the extension to store the response from the PaLM API. There is a token limit for the response field. This means responses may be truncated if they exceed a certain length. The standard limit is approximately 4096 characters, but this can vary depending on language and context. For more information, check [here](https://ai.google.dev/models/palm).

This extension will listen to the specified collection for new documents. When such a document is added, the extension will:

1. Substitute any variables from the document into the prompt.
2. Query the PaLM API to generate a response based on the prompt.
3. Write the response from the PaLM API back to the triggering document in the response field.

Each instance of the extension should be configured to perform one particular task. If you have multiple tasks, you can install multiple instances.

For example, you could use this extension to:

- Predict star ratings on a collection of product reviews.
- Classify customer feedback as positive, negative, or neutral.
- Summarize long articles.
- Extract named entities from text.
- Generate creative text, such as poems or code.

Here’s an example prompt used for predicting star ratings on a collection of product reviews:

```
Provide a star rating from 1-5 of the following review text: “This is a truly incredible water bottle, I keep it with me all the time when I’m traveling and it has never let me down.”
5

Provide a star rating from 1-5 of the following review text: “I really enjoyed the water bottle, I just wish they carried this in a larger size as I go for long hikes. But overall the aesthetic, manufacturing, and functional design are great for what I needed.”
4

Provide a star rating from 1-5 of the following review text: “The water bottle was fine, although the design was a bit lacking and could be improved.”
3

Provide a star rating from 1-5 of the following review text: “Please don’t get this water bottle, there are major design flaws, for example the cap doesn’t screw on fully so water leaks into my backpack all the time.”
1

Provide a star rating from 1-5 of the following review text: \“{{review_text}}\”
```

In this case, review_text is a field of the Firestore document and will be substituted into the prompt when querying PaLM.

### Choosing a PaLM Provider

There are currently two different APIs providing access to PaLM large language models. The PaLM Developer (Generative Language) API, and Vertex AI. This extension will prompt you to pick an API on installation. For production use-cases we recommend Vertex AI, as the Generative Language API is still in public preview.

- The PaLM developer (Generative Language) API is currently in public preview, and you will need to sign up [waitlist](https://makersuite.google.com/waitlist) if you want to use it. For details and limitations, see the [PaLM API documentation](https://developers.generativeai.google/guide/preview_faq).

- For more details on the Vertex AI PaLM API, see the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/overview)

## Safety Thresholds

Both the Generative Language for Developers and Vertex AI models have safety thresholds, to block inappropriate content. You can read the details here:

- [Vertex AI responsible AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/responsible-ai)
- [Generative AI for Developers safety settings documentation](https://developers.generativeai.google/guide/safety_setting)

At this moment, only Generative AI for Developers allows configuring safety thresholds via their API, and only for their text generation models, not their chat-bison models.

### Regenerating a response

Changing the state field of a completed document's status from `COMPLETED` to anything else will retrigger the extension for that document.

## Additional Setup

If you have not already done so, you will first need to apply for access to the PaLM API via this [waitlist](https://makersuite.google.com/waitlist).

Once you have access, please [enable the Generative Language API in your Google Cloud Project](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) before installing this extension.

Ensure you have a [Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) set up in your Firebase project, and enabled the Generative Language API in your Google Cloud Project before installing this extension.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan. You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Firestore
- Cloud Functions (See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))

[Learn more about Firebase billing.](https://firebase.google.com/pricing)

Additionally, this extension uses the PaLM API, which is currently in public preview. During the preview period, developers can try the PaLM API at no cost. Pricing will be announced closer to general availability. For more information on the PaLM API public preview, see the [PaLM API documentation](https://developers.generativeai.google/guide/preview_faq).




**Configuration Parameters:**

* Palm API Provider: There are two services which provide access to the PaLM API. Which would you like to use? If Vertex AI is selected, the service will be automatically enabled. If Generative Language is selected, you can provide an API key obtained through MakerSuite or your GCP console, or use Application Default Credentials if the Generative Language AI is enabled in your google cloud project.

* API Key (Generative Language AI for Developers Provider ONLY): If you selected Generative AI for Developers as your PaLM API provider, you can optionally choose to provide an API key. If you do not provide an API key, the extension will use Application Default Credentials, but will need the service enabled in GCP.

* Collection Path: Path to the Firestore collection where text will be generated.

* Prompt: Prompt. Use {{ handlebars }} for variable substitution from the created or updated doc.

* Variable fields: A comma separated list of fields to substitute as variables in the prompt.

* Response Field: The field in the message document into which to put the response.This is the name of the field in the Firestore document where you want the extension to store the response from the PaLM API. There is a token limit for the response field. This means responses may be truncated if they exceed a certain length.  The standard limit is approximately 4096 characters, but this can vary depending on language and context. For more information, check [here](https://ai.google.dev/models/palm).

* Cloud Functions location: Where do you want to deploy the functions created for this extension? For help selecting a location, refer to the [location selection guide](https://firebase.google.com/docs/functions/locations).

* Language model: Which language model do you want to use?

* Temperature: Controls the randomness of the output. Values can range over [0,1], inclusive. A value closer to 1 will produce responses that are more varied, while a value closer to 0 will typically result in less surprising responses from the model.

* Nucleus sampling probability: If specified, nucleus sampling will be used as the decoding strategy. Nucleus sampling considers the smallest set of tokens whose probability sum is at least a fixed value. Enter a value between 0 and 1.

* Sampling strategy parameter: If specified, top-k sampling will be used as the decoding strategy. Top-k sampling considers the set of topK most probable tokens.

* Candidate count: The default value is one. When set to an integer higher than one, additional candidate responses, up to the specified number, will be stored in Firestore under the 'candidates' field. Note this is only available as a feature if you  selected the Generative Language API for Developers as your Palm API provider.

* Candidates field: The field in the message document into which to put the other candidate responses if the candidate count parameter is greater than one. Note this is only available as a feature if you  selected the Generative Language API for Developers as your Palm API provider.

* Maximum number of tokens: If you have selected the Vertex AI service as your PaLM API provider, this parameter will be used to set the max_tokens parameter in the Vertex API request. It should be an integer in the range [1,1024]. The default value for the extension is 1024.

* Derogatory Content Threshold: Threshold for derogatory content. Specify what probability level of derogatory content is blocked by the PaLM provider. This threshold is applicable only to the Generative Language PaLM API.

* Toxicity Threshold: Threshold for toxic content. Specify what probability level of toxic content is blocked by the PaLM provider. This threshold is applicable only to the Generative Language PaLM API.

* Sexual Content Threshold: Threshold for sexual content. Specify what probability level of sexual content is blocked by the PaLM provider. This threshold is currently applicable only to the Generative Language PaLM API.

* Violent Content Threshold: Threshold for violent content. Specify what probability of violent content is blocked by the PaLM provider. This threshold is currently applicable only to the Generative Language PaLM API.

* Medical Content Threshold: Threshold for medical content. Specify what probability level of medical content is blocked by the PaLM provider. This threshold is applicable only to the Generative Language PaLM API.

* Dangerous Content Threshold: Threshold for dangerous content. Specify what probability level of dangerous content is blocked by the PaLM provider. This threshold is applicable only to the Generative Language PaLM API.

* Unspecified Harm Threshold: Threshold for non-specific harmful content. Specify what probability level of non-specific harmful content is blocked by the PaLM provider. This threshold is applicable only to the Generative Language PaLM API.



**Cloud Functions:**

* **generateText:** Listens to Firestore data writes to generate conversations.



**APIs Used**:

* aiplatform.googleapis.com (Reason: For access to the PaLM API if this provider is chosen.)



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.user (Reason: Allows this extension to access Cloud Firestore to read and process added messages.)

* aiplatform.user (Reason: Allows this extension to access the PaLM API via Vertex AI if this provider is chosen.)
