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

// payment gateway api
// token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
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
