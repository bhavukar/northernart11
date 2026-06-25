import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

if (!keyId || !keySecret) {
  console.warn('Warning: Razorpay API keys are missing in environment variables.');
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
