import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import xss from "xss";

const isString = (val) => typeof val === "string";
const nameRegex = /^[a-zA-Z0-9 ]+$/;
const phoneRegex = /^\d{8}$/;
const emailRegex = /^(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]+(?<![._-])@(?![.-])(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

// Sun Zihan, A0259581R
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;

    if (!name || !email || !password || !phone || !address || !answer) {
      return res.status(400).send({ success: false, message: "Missing required registration details" });
    }

    if (![name, email, password, phone, address, answer].every(isString)) {
      return res.status(400).send({ success: false, message: "Invalid input format" });
    }

    if (!nameRegex.test(name) || name.length > 50) {
      return res.status(400).send({ success: false, message: "Invalid name format or length" });
    }
    if (!emailRegex.test(email) || email.length > 320) {
      return res.status(400).send({ success: false, message: "Invalid email format or length" });
    }
    if (password.length < 6 || password.length > 64) {
      return res.status(400).send({ success: false, message: "Password must be 6-64 characters" });
    }
    if (!phoneRegex.test(phone)) {
      return res.status(400).send({ success: false, message: "Phone must be exactly 8 digits" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).send({ success: false, message: "Email already registered, please login" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await new userModel({
      name: xss(name),
      email: email.toLowerCase(),
      phone: phone,
      address: xss(address),
      password: hashedPassword,
      answer: xss(answer),
    }).save();

    return res.status(201).send({
      success: true,
      message: "Registration successful, please login",
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(`Register Error: ${error.message}`);
    
    if (error.name === "ValidationError") {
      return res.status(400).send({ success: false, message: error.message });
    }
    
    return res.status(500).send({ success: false, message: "Internal server error during registration" });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ success: false, message: "Email and password are required" });
    }

    if (!isString(email) || !isString(password)) {
      return res.status(400).send({ success: false, message: "Invalid email or password format" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).send({ success: false, message: "Invalid email or password" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).send({ success: false, message: "Invalid email or password" });
    }

    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).send({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(`Login Error: ${error.message}`);
    return res.status(500).send({ success: false, message: "Internal server error during login" });
  }
};

// Sun Zihan, A0259581R
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    if (!email || !answer || !newPassword) {
      return res.status(400).send({ success: false, message: "Missing required fields for password reset" });
    }

    if (!isString(email) || !isString(answer) || !isString(newPassword)) {
      return res.status(400).send({ success: false, message: "Invalid field format" });
    }

    const user = await userModel.findOne({ email, answer });
    if (!user) {
      return res.status(404).send({ success: false, message: "Incorrect email or security answer" });
    }

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });

    return res.status(200).send({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error(`Forgot Password Error: ${error.message}`);
    return res.status(500).send({ success: false, message: "Internal server error during password reset" });
  }
};

// Sun Zihan, A0259581R
export const testController = (req, res) => {
  try {
    return res.status(200).send({
      success: true,
      message: "Protected route accessed",
    });
  } catch (error) {
    console.error(`Test Error: ${error.message}`);
    if (!res.headersSent) {
      return res.status(500).send({ success: false, message: "Server error" });
    }
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const { name, password, address, phone } = req.body;

    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    
    if (password !== undefined && password !== null && password !== "") {
      if (password.length < 6 || password.length > 64) {
        return res.status(400).send({ 
            success: false, 
            message: "Password must be 6-64 characters" 
        });
      }
    }

    if (name !== undefined && name !== null && name !== "") {
      if (name.length > 50 || !nameRegex.test(name)) {
        return res.status(400).send({ success: false, message: "Invalid name format or length" });
      }
    }

    if (phone !== undefined && phone !== null) {
      if (!phoneRegex.test(phone)) {
        return res.status(400).send({ success: false, message: "Phone must be exactly 8 digits" });
      }
    }

    if (address !== undefined && address !== null) {
      if (address.length > 100 || address.trim() === "") {
        return res.status(400).send({ success: false, message: "Invalid address format" });
      }
    }

    const updateData = {};
    if (name) updateData.name = xss(name);
    if (phone) updateData.phone = phone;
    if (address) updateData.address = xss(address);
    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      updateData, 
      { new: true, runValidators: true }
    );

    return res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      updatedUser: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error(`Profile Update Error: ${error.message}`);
    
    if (error.name === "ValidationError") {
      return res.status(400).send({ success: false, message: error.message });
    }
    
    return res.status(500).send({
      success: false,
      message: "Internal server error during profile update",
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while updating orders",
      error,
    });
  }
};