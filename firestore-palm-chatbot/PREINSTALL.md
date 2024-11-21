Use this extension to easily deploy a chatbot using the Vertex AI PaLM API, stored and managed by Cloud Firestore.

On install you will be asked to provide:

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

### Regenerating a response

Changing the state field of a completed document's status from `COMPLETED` to anything else will retrigger the extension for that document.

## Billing

To install an extension, your project must be on the Blaze (pay as you go) plan. You will be charged a small amount (typically around $0.01/month) for the Firebase resources required by this extension (even if it is not used).
This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:

- Cloud Firestore
- Cloud Functions (See [FAQs](https://firebase.google.com/support/faq#extensions-pricing))
- Associated costs for using Vertex AI ([see their pricing](https://cloud.google.com/vertex-ai/pricing#generative_ai_models)) if you use this provider.

[Learn more about Firebase billing.](https://firebase.google.com/pricing)
