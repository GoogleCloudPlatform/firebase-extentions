#!/bin/bash

# Build Dataflow Flex Template (Download the JAR file first)
echo -e "${YELLOW}Step 6:Building Dataflow Flex Template...${NC}"
gcloud dataflow flex-template build gs://$PROJECT_ID.appspot.com/$EXT_INSTANCE_ID-dataflow-restore \
  --image-gcr-path $LOCATION-docker.pkg.dev/$PROJECT_ID/$EXT_INSTANCE_ID/dataflow/restore:latest \
  --sdk-language JAVA \
  --flex-template-base-image JAVA11 \
  --jar $JAR_PATH \
  --env FLEX_TEMPLATE_JAVA_MAIN_CLASS="com.pipeline.RestorationPipeline" \
  --project $PROJECT_ID
echo -e "${GREEN}Dataflow Flex Template built successfully.${NC}"
SUCCESS_TASKS+=("${GREEN}${TICK} Dataflow Flex Template built successfully.")