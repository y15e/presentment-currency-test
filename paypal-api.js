import fetch from "node-fetch";

const base = "https://api-m.paypal.com";

const clientIdSecrets = {
  merchant1: `${process.env.PAYPAL_CLIENT_ID1}:${process.env.PAYPAL_CLIENT_SECRET1}`,
  merchant2: `${process.env.PAYPAL_CLIENT_ID2}:${process.env.PAYPAL_CLIENT_SECRET2}`,
  merchant3: `${process.env.PAYPAL_CLIENT_ID3}:${process.env.PAYPAL_CLIENT_SECRET3}`
}

export async function createOrder(merchant, args) {
  
  console.log('[createOrder]')
  console.dir(args)
  
  const accessToken = await generateAccessToken(merchant);
  
  const url = `${base}/v2/checkout/orders`;
  
  const response = await fetch(url, {
    
    method: "post",
    
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    
    body: JSON.stringify({
      intent: "AUTHORIZE",
      purchase_units: [
        {
          amount: {
            currency_code: args.currency,
            value: parseFloat(args.amount)
          },
        },
      ],
    }),
  });

  return handleResponse(response);
}

// Authorize
export async function authorizePayment(merchant, orderId) {
  
  console.log('[authorizePayment]')
  console.dir(orderId)
  
  const accessToken = await generateAccessToken(merchant);
  
  // Get order for 3DS
  const urlGet = `${base}/v2/checkout/orders/${orderId}`;
  
  const responseGet = await fetch(urlGet, {
    method: "get",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const responseGetJson = await responseGet.json()
  if (responseGetJson.payment_source.card.authentication_result) {
    const authResult = responseGetJson.payment_source.card.authentication_result
    if (authResult.liability_shift !== 'POSSIBLE') {
      return
    }
  }
  
  // Authorize
  const url = `${base}/v2/checkout/orders/${orderId}/authorize`;
  
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
}

// Capture
export async function capturePayment(merchant, orderId) {
  
  const accessToken = await generateAccessToken(merchant);
  
  const url = `${base}/v2/checkout/orders/${orderId}/capture`;
  
  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return handleResponse(response);
}

export async function generateAccessToken(merchant) {
  
  const auth = Buffer.from(clientIdSecrets[merchant]).toString("base64");
  
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "post",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  
  const jsonData = await handleResponse(response);
  
  return jsonData.access_token;
}

export async function generateClientToken(merchant) {
  
  const accessToken = await generateAccessToken(merchant);
  
  const response = await fetch(`${base}/v1/identity/generate-token`, {
    method: "post",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US",
      "Content-Type": "application/json",
    },
  });
  
  const jsonData = await handleResponse(response);
  
  return jsonData.client_token;
}

async function handleResponse(response) {
  
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorMessage = await response.text();
  
  throw new Error(errorMessage);
}
