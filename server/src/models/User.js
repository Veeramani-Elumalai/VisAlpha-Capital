import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: false  // Optional for Google OAuth users
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local"
  },
  picture: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
