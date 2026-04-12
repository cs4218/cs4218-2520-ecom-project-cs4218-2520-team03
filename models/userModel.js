// Sun Zihan, A0259581R
import mongoose from "mongoose";

const emailRegex = /^(?![._-])(?!.*[._-]{2})[a-zA-Z0-9._-]+(?<![._-])@(?![.-])(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
      match: [/^[a-zA-Z0-9 ]+$/, "Name can only contain alphanumeric characters and spaces"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      maxlength: [320, "Email is too long"],
      match: [emailRegex, "Please provide a valid email address structure"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      maxlength: [64, "Password cannot exceed 64 characters"], 
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{8}$/, "Phone number must be exactly 8 digits"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      maxlength: [100, "Address cannot exceed 100 characters"], 
    },
    answer: {
      type: String,
      required: [true, "Security answer is required"],
      trim: true,
      maxlength: [50, "Answer cannot exceed 50 characters"], 
    },
    role: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("users", userSchema);