// Seah Yi Xun Ryo, A0252602R
// Unit tests for paymentController: braintreeTokenController and brainTreePaymentController.


import { braintreeTokenController, brainTreePaymentController } from "./paymentController.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";

// jest.mock is hoisted before imports, so mock fns must be defined inside the factory.
// They are exposed via _mocks so tests can access the same jest.fn() instances.
jest.mock("braintree", () => {
  const generate = jest.fn();
  const sale = jest.fn();
  return {
    BraintreeGateway: jest.fn(() => ({
      clientToken: { generate },
      transaction: { sale },
    })),
    Environment: { Sandbox: "sandbox" },
    _mocks: { generate, sale },
  };
});

jest.mock("../models/orderModel.js");
jest.mock("../models/productModel.js");

// Retrieve the stable mock fn references created inside the factory above
const { _mocks: { generate: mockGenerate, sale: mockSale } } = jest.requireMock("braintree");

// ── helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

// Seah Yi Xun Ryo, A0252602R
describe("braintreeTokenController", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = mockRes();
    jest.clearAllMocks();
  });

  it("calls gateway.clientToken.generate and sends the response on success", async () => {
    const fakeResponse = { clientToken: "fake-token-123" };
    mockGenerate.mockImplementation((opts, cb) => cb(null, fakeResponse));

    await braintreeTokenController(req, res);

    expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
    expect(res.send).toHaveBeenCalledWith(fakeResponse);
  });

  // Seah Yi Xun Ryo, A0252602R
  it("responds with 500 when gateway returns an error", async () => {
    const fakeError = new Error("gateway error");
    mockGenerate.mockImplementation((opts, cb) => cb(fakeError, null));

    await braintreeTokenController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(fakeError);
  });
});

// Seah Yi Xun Ryo, A0252602R
describe("brainTreePaymentController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        nonce: "test-nonce",
        cart: [
          { _id: "p1", name: "Item A", price: 30 },
          { _id: "p2", name: "Item B", price: 20 },
        ],
      },
      user: { _id: "user-123" },
    };
    res = mockRes();
    jest.clearAllMocks();
  });

  it("totals the cart prices and calls gateway.transaction.sale with correct amount", async () => {
    const fakeResult = { success: true };
    mockSale.mockImplementation((opts, cb) => cb(null, fakeResult));

    await brainTreePaymentController(req, res);

    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 50,
        paymentMethodNonce: "test-nonce",
        options: { submitForSettlement: true },
      }),
      expect.any(Function)
    );
  });

  // Seah Yi Xun Ryo, A0252602R
  // Seah Yi Xun Ryo, A0252602R
  it("saves a new order and responds with ok:true on successful transaction", async () => {
    const fakeResult = { success: true };
    mockSale.mockImplementation((opts, cb) => cb(null, fakeResult));

    const mockOrderSave = jest.fn().mockResolvedValue({});
    orderModel.mockImplementation(() => ({ save: mockOrderSave }));

    const mockProductSave = jest.fn().mockResolvedValue({});
    productModel.findById.mockResolvedValue({
      quantity: "5",
      save: mockProductSave,
    });

  await brainTreePaymentController(req, res);

  expect(orderModel).toHaveBeenCalledWith({
    products: req.body.cart,
    payment: fakeResult,
    buyer: "user-123",
  });
  expect(mockOrderSave).toHaveBeenCalled();
  expect(productModel.findByIdAndUpdate).toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith({ ok: true });
});

  it("responds with 500 when the transaction fails", async () => {
    const fakeError = new Error("transaction failed");
    mockSale.mockImplementation((opts, cb) => cb(fakeError, null));

    await brainTreePaymentController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(fakeError);
  });

  // Seah Yi Xun Ryo, A0252602R
  it("handles an empty cart with a total of 0", async () => {
    req.body.cart = [];
    const fakeResult = { success: true };
    mockSale.mockImplementation((opts, cb) => cb(null, fakeResult));

    await brainTreePaymentController(req, res);

    expect(mockSale).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 0 }),
      expect.any(Function)
    );
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});
