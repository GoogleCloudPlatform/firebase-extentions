## Version 1.0.0

- **Breaking:** Drop Google AI as a provider of PaLM. Google AI is deprecating their PaLM API, but PaLM is still supported for Vertex AI.

## Version 0.1.11

feat - support latest PaLM models

## Version 0.1.10

fixed - fixed issue with "Block none" in safety threshold configs

docs - update to reflect current state of PaLM safety thresholds

## Version 0.1.9

fixed - improved safety metadata format

feature - add content filter threshold param

feature - add max output tokens param

feature - improve prompt

fixed - fix apiEndpoints location error (#142)

feature - handle content filters for both APIs (#138)

fixed - fix PaLM collection name regex

fixed - fix PaLM loop bug (#88)

fixed - fix regen functionality for PaLM (#86)

## Version 0.1.8

- Added a content filter threshold parameter
- bumped dependencies

## Version 0.1.7

- Improved summarization prompt to reduce hallucinations
- Added parameter for max output tokens on response

## Version 0.1.6

- Fixed location bug where apiEndpoint was incorrectly entered

## Version 0.1.5

- Removed unnecessary Storage bucket requirement from PREINSTALL.
- Support both Vertex and Generative Language PaLM API Providers.
- Handle Generative Language Content Filter.
- Add support for providing an API key for the Generative Language PaLM Provider.

## Version 0.1.4

- Improve error handling.
- Reduce unnecessary triggering of function
- allow for regenerating responses by changing "status.state" field

## Version 0.1.3

Add warning about waitlist.

## Version 0.1.2

Updated docs.

## Version 0.1.1

Updated configuration parameters in extension.yaml.

## Version 0.1.0

Initial release of the firestore-palm-summarize-text extension.
