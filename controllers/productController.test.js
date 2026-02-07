import fs from "fs";
import slugify from "slugify";
import productModel from "../models/productModel.js";
import {validateProductFields, attachPhotoIfPresent, saveProductService, createProductController, deleteProductController, updateProductController} from "./productController.js";

jest.mock("fs", () => ({
    readFileSync: jest.fn(),
}));
jest.mock('slugify');
jest.mock("../models/productModel.js");

function makeRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
}

function makeReq({
                     fields = {},
                     files = {},
                 } = {}) {
    return { fields, files };
}


beforeEach(() => {
    jest.clearAllMocks();
});

describe("validateProductFields", () => {

    test("returns 400 when name missing", () => {
        expect(validateProductFields({}, {})).toEqual({
            status: 400,
            error: "Name is Required",
        });
    });
    test("returns 400 when description missing", () => {
        expect(
            validateProductFields({ name: "mockName" }, {})
        ).toEqual({ status: 400, error: "Description is Required" });
    });

    test("returns 400 when price missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc" }, {})
        ).toEqual({ status: 400, error: "Price is Required" });
    });
    test("returns 400 when category missing", () => {
        expect(
            validateProductFields({ name: "mockName", description: "mockDesc", price: 1 }, {})
        ).toEqual({ status: 400, error: "Category is Required" });
    });
    test("returns 400 when quantity missing", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory" },
                {}
            )
        ).toEqual({ status: 400, error: "Quantity is Required" });
    });
    test("returns 400 when photo too large (> 1000000)", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_001 } }
            )
        ).toEqual({ status: 400, error: "Photo should be less then 1mb" });
    });
    test("returns null when photo is 1mb", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_000 } }
            )
        ).toBeNull();
    });
    test("returns null when everything without a photo is valid", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                {}
            )
        ).toBeNull();
    });
    test("returns null when everything with a photo is valid", () => {
        expect(
            validateProductFields(
                { name: "mockName", description: "mockDesc", price: 1, category: "mockCategory", quantity: 1 },
                { photo: { size: 1_000_000 } }
            )
        ).toBeNull();
    });
});
describe("attachPhotoIfPresent", () => {
    describe("when no photo is provided", () => {
        let productDoc;
        let readFile;
        beforeEach(() => {
            //arrange
            productDoc = { photo: { data: null, contentType: null } };
            readFile = jest.fn();
            //act
            attachPhotoIfPresent(productDoc, null, readFile);
        });

        test("readFile won't be called", () => {
            expect(readFile).not.toHaveBeenCalled();
        });

        test("product's photo data stays null", () => {
            expect(productDoc.photo.data).toBeNull();
        });

        test("product's photo contentType stays null", () => {
            expect(productDoc.photo.contentType).toBeNull();
        });
    });
    describe("when photo is provided", () => {
        let productDoc;
        let readFile;
        let buf;
        //arrange
        beforeEach(() => {
            //arrange
            productDoc = { photo: {} };
            readFile = jest.fn(() => buf);
            buf = Buffer.from("abc");
            //act
            attachPhotoIfPresent(productDoc, { path: "/tmp/x", type: "image/png" }, readFile);
        });
        test("readFile to be called with path", () => {
            expect(readFile).toHaveBeenCalledWith("/tmp/x");
        });
        test("product photo data to be buf", () => {
            expect(productDoc.photo.data).toBe(buf);
        });
        test("product photo content type to be image", () => {
            expect(productDoc.photo.contentType).toBe("image/png");
        });
    });
});
describe("saveProductService", () => {
    const makeProductDoc = (overrides = {}) => ({
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
        photo: { data: null, contentType: null },
        ...overrides,
    });
    const validFields = {
        name: "mockName",
        description: "mockDesc",
        price: 1,
        category: "mockCat",
        quantity: 1,
    };
    beforeEach(() => {
        jest.clearAllMocks();
        slugify.mockReturnValue("mock-name");
    });
    describe("when validation fails", () => {
        let res, productDoc, readFile, fields, files;

        beforeEach(async () => {
            productDoc = makeProductDoc();
            readFile = jest.fn();

            fields = { ...validFields, name: "" };
            files = {};

            res = await saveProductService({ productDoc, fields, files, readFile });
        });

        test("returns ok:false", () => {
            expect(res.ok).toBe(false);
        });

        test("returns status 400", () => {
            expect(res.status).toBe(400);
        });

        test("does not call slugify", () => {
            expect(slugify).not.toHaveBeenCalled();
        });

        test("does not call productDoc.set", () => {
            expect(productDoc.set).not.toHaveBeenCalled();
        });

        test("does not call productDoc.save", () => {
            expect(productDoc.save).not.toHaveBeenCalled();
        });

        test("does not call readFile", () => {
            expect(readFile).not.toHaveBeenCalled();
        });
    });
    describe("when validation passes with photo", () => {
        let productDoc, readFile, files;
        beforeEach(async () => {
            productDoc = {
                set: jest.fn(),
                save: jest.fn().mockResolvedValue(undefined),
                photo: { data: null, contentType: null },
            };

            readFile = jest.fn().mockReturnValue(Buffer.from("img"));
            files = { photo: { size: 10, path: "/tmp/p.png", type: "image/png" } };
            await saveProductService({ productDoc, fields: validFields, files, readFile });
        });

        test("calls productDoc.set", () => {
            expect(productDoc.set).toHaveBeenCalledTimes(1);
        });

        test("calls readFile", () => {
            expect(readFile).toHaveBeenCalledTimes(1);
        });

        test("calls readFile with photo.path", () => {
            expect(readFile).toHaveBeenCalledWith("/tmp/p.png");
        });

        test("calls productDoc.save", () => {
            expect(productDoc.save).toHaveBeenCalledTimes(1);
        });
    });
    describe("when validation passes without photo", () => {
        let productDoc, readFile, files;

        beforeEach(async () => {
            productDoc = makeProductDoc();
            readFile = jest.fn();
            files = {};

            await saveProductService({ productDoc, fields: validFields, files, readFile });
        });

        test("calls productDoc.set", () => {
            expect(productDoc.set).toHaveBeenCalledTimes(1);
        });

        test("does not call readFile", () => {
            expect(readFile).not.toHaveBeenCalled();
        });

        test("calls productDoc.save", () => {
            expect(productDoc.save).toHaveBeenCalledTimes(1);
        });
    });
});

