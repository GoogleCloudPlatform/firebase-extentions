## Version 1.0.0

- **Breaking:** Drop Google AI as a provider of PaLM. Google AI is deprecating their PaLM API, but PaLM is still supported for Vertex AI.

## Version 0.1.10

feat - support latest PaLM models

## Version 0.1.9

docs - update to reflect current state of PaLM safety thresholds

## Version 0.1.8

fixed - bug where context could not be added

## Version 0.1.7

fixed - truncate history if payload is close to limit

fixed - fix apiEndpoints location error (#142)

feature - handle content filters for both APIs (#138)

fixed - updated regex validation for collection paths (#133)

feature - add palm provider option to chatbot (#113)

fixed - fix PaLM collection name regex

fixed - fix PaLM loop bug (#88)

fixed - fix regen functionality for PaLM (#86)

fixed - fix regenerate bug (#83)

fixed - skip documents which are missing fields (#63)

fixed - filter on completed, to avoid errors

feature - update docs for publish

## Version 0.1.6

- Truncate requests sent to API to fix bug for long conversations.
- Bump dependencies for PaLM APIs

## Version 0.1.5

- Removed unnecessary Storage bucket requirement from PREINSTALL.
- Support both Vertex and Generative Language PaLM API Providers.
- Handle Generative Language Content Filter.
- Add support for providing an API key for the Generative Language PaLM Provider.

## Version 0.1.4

- Improve error handling.
- Reduce unnecessary triggering of generateMessage function
- allow for regenerating responses by changing "status.state" field
- skip messages in history which do not have both a promptField and a responseField

## Version 0.1.3

Add warning about waitlist.

## Version 0.1.2

Updated docs.

## Version 0.1.1

Updated configuration parameters in extension.yaml.

## Version 0.1.0

Initial release of the firestore-palm-chatbot extension.
