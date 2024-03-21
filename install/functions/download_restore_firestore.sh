#!/bin/bash

echo -e "${YELLOW}Downloading the JAR file...${NC}"
curl -L -o restore-firestore.jar "https://github.com/GoogleCloudPlatform/firebase-extensions/blob/%40invertase/ic-scheduled-backups/firestore-incremental-capture-pipeline/target/restore-firestore.jar?raw=true"
echo -e "${GREEN}JAR file downloaded successfully.${NC}"

  SUCCESS_TASKS+=("${GREEN}${TICK} Succcessfully downloaded assets.")