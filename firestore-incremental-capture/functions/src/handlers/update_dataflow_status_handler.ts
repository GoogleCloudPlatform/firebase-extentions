import * as functionsv2 from 'firebase-functions/v2';

export const updateDataflowStatusHandler = async (
  event: functionsv2.CloudEvent<any>
) => {
  console.log('updateDataflowStatusHandler', event);
  return;
};
