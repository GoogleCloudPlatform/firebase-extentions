#!/bin/bash

# Find extension's service account email
echo -e "${GREEN}Finding extension's service account email...${NC}"

export SA_EMAIL=$(gcloud iam service-accounts list --format="value(EMAIL)" --filter="displayName='Firebase Extensions $EXT_INSTANCE_ID service account' AND DISABLED=False" --project="$PROJECT_ID")
echo -e "${GREEN}Service account email found: $SA_EMAIL${NC}"


# Add required policy binding for Artifact Registry
echo -e "${YELLOW}Step 4:Adding IAM policy binding for Artifact Registry...${NC}"
gcloud artifacts repositories add-iam-policy-binding $EXT_INSTANCE_ID --location=$LOCATION --project=$PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role=roles/artifactregistry.writer
SUCCESS_TASKS+=("${GREEN}${TICK} Policy binding added successfully.")
echo -e "${GREEN}Policy binding added successfully.${NC}"

# Add roles for extension service account to trigger Dataflow
echo -e "${YELLOW}Step 5:Adding roles for service account to trigger Dataflow...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID --project $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role=roles/artifactregistry.writer
gcloud projects add-iam-policy-binding $PROJECT_ID --project $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role=roles/iam.serviceAccountUser
SUCCESS_TASKS+=("${GREEN}${TICK} Roles added successfully")
echo -e "${GREEN}Roles added successfully.${NC}"