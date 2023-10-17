import "dotenv/config";
import express from "express";
import * as paypal from "./paypal-api.js";

const { PORT = 8888 } = process.env;

const clientIds = {
  merchant1: process.env.PAYPAL_CLIENT_ID1,
  merchant2: process.env.PAYPAL_CLIENT_ID2,
  merchant3: process.env.PAYPAL_CLIENT_ID3,
}
  
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json())

app.use((req, res, next) => {
  
  // Basic Auth
  const auth = {
    login: process.env.BASIC_AUTH_LOGIN,
    password: process.env.BASIC_AUTH_PASSWORD
  }

  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')
  
  if (login && password && login === auth.login && password === auth.password) {
    return next()
  }

  res.set('WWW-Authenticate', 'Basic realm="401"')
  res.status(401).send('Authentication required.')
})

app.get("/:merchant", async (req, res) => {
  
  const merchant = req.params.merchant
  
  try {
    
    const clientId = clientIds[merchant]
    const clientToken = await paypal.generateClientToken(merchant);
    
    res.render("checkout", {
      clientId,
      clientToken,
      merchant
    });
    
  } catch (err) {
    res.status(500).send(err.message);
  }
  
});

app.post("/:merchant/api/orders", async (req, res) => {
  
  const merchant = req.params.merchant
  
  try {
    const order = await paypal.createOrder(merchant, req.body);
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/:merchant/api/orders/:orderID/authorize", async (req, res) => {
  
  const { merchant, orderID } = req.params;
  
  try {
    const authorizeData = await paypal.authorizePayment(merchant, orderID);
    res.json(authorizeData);
  } catch (err) {
    res.status(500).send(err.message);
  }
  
});

app.post("/:merchant/api/orders/:orderID/capture", async (req, res) => {
  
  const { merchant, orderID } = req.params;
  
  try {
    const captureData = await paypal.capturePayment(merchant, orderID);
    res.json(captureData);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/`);
});
