#!/bin/bash

# Configure Artifact Registry
echo -e "${YELLOW}Step 3: Configuring Artifact Registry...${NC}"

ARTIFACT_EXISTS=$(gcloud artifacts repositories list --location=$LOCATION --project=$PROJECT_ID --format="value(name)")

if echo "$ARTIFACT_EXISTS" | grep -q "$EXT_INSTANCE_ID"; then
  echo -e "${YELLOW}Artifact Registry already exists, skipping creation.${NC}"
else
  gcloud artifacts repositories create $EXT_INSTANCE_ID --repository-format=docker --location=$LOCATION --project=$PROJECT_ID --async
  gcloud auth configure-docker $LOCATION-docker.pkg.dev
  echo -e "${GREEN}Artifact Registry configured successfully.${NC}"
  SUCCESS_TASKS+=("${GREEN}${TICK} Artifact Registry configured successfully.")
fi

SUCCESS_TASKS+=("${GREEN}${TICK} Artifact Registry configured successfully.")
