import mongoose, { Schema } from "mongoose";

const RefreshTokenSchema = new Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const RefreshToken = mongoose.model("RefreshToken", RefreshTokenSchema);