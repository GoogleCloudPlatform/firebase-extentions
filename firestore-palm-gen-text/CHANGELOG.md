## Version 1.0.0

- **Breaking:** Drop Google AI as a provider of PaLM. Google AI is deprecating their PaLM API, but PaLM is still supported for Vertex AI.

## Version 0.1.10

docs - update response field to mention response length limitation

feat - support latest PaLM models

## Version 0.1.9

fixed - fixed issue with "Block none" in safety threshold configs

docs - update to reflect current state of PaLM safety thresholds

## Version 0.1.8

- Added parameters for configuring filter thresholds on developers PaLM API
- Increased Max content length default

## Version 0.1.7

- Fixed location bug where apiEndpoint was incorrectly entered

## Version 0.1.6

- Removed unnecessary Storage bucket requirement from PREINSTALL.
- Support both Vertex and Generative Language PaLM API Providers.
- Handle PaLM Content Filters.
- Add support for providing an API key for the Generative Language PaLM Provider.

## Version 0.1.5

- Improve error handling.
- Reduce unnecessary triggering of function
- allow for regenerating responses by changing "status.state" field

## Version 0.1.4

Updated the validation for the `Fields` parameter to allow more Firestore field names format.

## Version 0.1.3

Add warning about waitlist.

## Version 0.1.2

Updated docs.

## Version 0.1.1

- Fixed bug in CANDIDATE_COUNT not being pulled from config
- Updated configs in extension.yaml

## Version 0.1.0

Initial release of the firestore-palm-gen-text extension.
