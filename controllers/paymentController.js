import braintree from "braintree";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

//Chen Zhiruo A0256855N
//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// Seah Yi Xun Ryo, A0252602R
// In-memory cache for Braintree client token — valid for 24h, refresh 30min before expiry
const tokenCache = { value: null, expiresAt: 0 };
const TOKEN_TTL_MS = 23.5 * 60 * 60 * 1000;

// Test helpers — reset/set cache for unit tests
export const __resetTokenCache = () => {
  tokenCache.value = null;
  tokenCache.expiresAt = 0;
};
export const __setTokenCacheForTesting = (value, expiresAt) => {
  tokenCache.value = value;
  tokenCache.expiresAt = expiresAt;
};

// payment gateway api
// token
export const braintreeTokenController = async (req, res) => {
  try {
    const now = Date.now();
    if (tokenCache.value && now < tokenCache.expiresAt) {
      return res.send({ clientToken: tokenCache.value });
    }

    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        tokenCache.value = response.clientToken;
        tokenCache.expiresAt = Date.now() + TOKEN_TTL_MS;
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;

    cart.forEach((i) => {
      total += i.price;
    });

    const result = await new Promise((resolve, reject) => {
      gateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    });

    await new orderModel({
      products: cart,
      payment: result,
      buyer: req.user._id,
    }).save();

    await Promise.all(
      cart.map(async (product) => {
        await productModel.findByIdAndUpdate(product._id, {
          $inc: { quantity: -1 } // This decrements the value by 1 atomically
        });
      })
    );

    return res.json({ ok: true });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
