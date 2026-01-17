import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

export const twilioClient = twilio(accountSid, authToken);

// Phone Number Management
export async function listPhoneNumbers() {
  try {
    const phoneNumbers = await twilioClient.incomingPhoneNumbers.list();
    return phoneNumbers;
  } catch (error) {
    console.error('Error listing phone numbers:', error);
    throw error;
  }
}

export async function provisionPhoneNumber(phoneNumber: string) {
  try {
    const number = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
    });
    return number;
  } catch (error) {
    console.error('Error provisioning phone number:', error);
    throw error;
  }
}

export async function searchPhoneNumbers(areaCode?: string) {
  try {
    const options: any = { limit: 10 };
    if (areaCode) {
      options.areaCode = areaCode;
    }
    const available = await twilioClient.availablePhoneNumbers('US').local.list(options);
    return available;
  } catch (error) {
    console.error('Error searching phone numbers:', error);
    throw error;
  }
}

export async function updatePhoneNumber(sid: string, webhookUrl: string) {
  try {
    const number = await twilioClient.incomingPhoneNumbers(sid).update({
      voiceUrl: webhookUrl,
      voiceMethod: 'POST',
    });
    return number;
  } catch (error) {
    console.error('Error updating phone number:', error);
    throw error;
  }
}

export async function deletePhoneNumber(sid: string) {
  try {
    await twilioClient.incomingPhoneNumbers(sid).remove();
    return true;
  } catch (error) {
    console.error('Error deleting phone number:', error);
    throw error;
  }
}

// Call Management
export async function makeCall(to: string, from: string, url: string) {
  try {
    const call = await twilioClient.calls.create({
      to,
      from,
      url,
    });
    return call;
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
}

export async function getCall(callSid: string) {
  try {
    const call = await twilioClient.calls(callSid).fetch();
    return call;
  } catch (error) {
    console.error('Error getting call:', error);
    throw error;
  }
}

