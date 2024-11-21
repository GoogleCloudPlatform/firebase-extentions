Use this extension to easily deploy a chatbot using the PaLM API, stored and managed by Cloud Firestore.

On install you will be asked to provide:

- A **PaLM API Provider** This extension makes use of the PaLM large language model. There is a choice of provider for this API. See the section below for more details.
- A **Firestore collection path**, used to store conversation history represented as documents. This extension will listen to the specified collection(s) for new message documents.

The collection path also supports wildcards, so you can trigger the extension on multiple collections, each with their own private conversation history. This is useful if you want to create separate conversations for different users, or support multiple chat sessions.

Message documents might look like this:

```
{
  prompt: “What is the best museum to visit in Barcelona, Spain?”
}
```

When a message document is added, the extension will:

- Obtain conversation history by sorting the documents of the collection.
- Query the language model you selected during configuration.
- Write the message back to the triggering document in a configurable response field.

A createTime field will be automatically created for you on document creation, and will be used to order the conversation history. PaLM has a limited context window, so only the most recent messages will be used as history to generate the next response. Alternatively, If documents in the specified collection already contain a field representing timestamps, you can use that as the order field instead.

You can configure the chatbot to return different responses by providing context during installation. For example, if you want the chatbot to act as a travel guide, you might use this as the context:

```
I want you to act as a travel guide. I will ask you questions about various travel destinations, and you will describe those destinations and give me suggestions on places to visit.
```

You can also configure the model to return different results by tweaking model parameters (temperature, candidate count, etc.), which are exposed as configuration during install as well.

### Choosing a PaLM Provider

There are currently two different APIs providing access to PaLM large language models. The PaLM Developer (Generative Language) API, and Vertex AI. This extension will prompt you to pick an API on installation. For production use-cases we recommend Vertex AI, as the Generative Language API is still in public preview.

- For more details on the Vertex AI PaLM API, see the [Vertex AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/overview)

- The PaLM developer (Generative Language) API is currently in public preview, and you will need to sign up [waitlist](https://makersuite.google.com/waitlist) if you want to use it. For details and limitations, see the [PaLM API documentation](https://developers.generativeai.google/guide/preview_faq).

### Regenerating a response

Changing the state field of a completed document's status from `COMPLETED` to anything else will retrigger the extension for that document.

## Additional Setup

If you have not already done so, you will first need to apply for access to the PaLM API via this [waitlist](https://makersuite.google.com/waitlist).

Once you have access, please [enable the Generative Language API in your Google Cloud Project](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com) before installing this extension.

Ensure you have a [Cloud Firestore database](https://firebase.google.com/docs/firestore/quickstart) set up in your Firebase project, and enabled the Generative Language API in your Google Cloud Project before installing this extension.

## Safety Thresholds

Both the Generative Language for Developers and Vertex AI models have safety thresholds, to block inappropriate content. You can read the details here:

- [Vertex AI responsible AI documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/responsible-ai)
- [Generative AI for Developers safety settings documentation](https://developers.generativeai.google/guide/safety_setting)

At this moment, only Generative AI for Developers allows configuring safety thresholds via their API, and only for their text generation models, not their chat-bison models.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan. You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Firestore
- Cloud Functions (See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))

[Learn more about Firebase billing.](https://firebase.google.com/pricing)

Additionally, this extension uses the PaLM API, which is currently in public preview. During the preview period, developers can try the PaLM API at no cost. Pricing will be announced closer to general availability. For more information on the PaLM API public preview, see the [PaLM API documentation](https://developers.generativeai.google/guide/preview_faq).
