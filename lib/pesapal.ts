// Create a file: lib/pesapal.ts
export async function getPesapalToken() {
  const isProd = process.env.PESAPAL_ENV === 'production';
  const baseUrl = isProd ? 'https://pay.pesapal.com/v3' : 'https://cybqa.pesapal.com/pesapalv3';

  const res = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.token;
}
