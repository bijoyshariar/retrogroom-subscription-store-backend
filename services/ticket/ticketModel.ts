import mongoose, { Schema } from "mongoose";
import { TicketDocument } from "./ticketTypes";
import crypto from "crypto";

const ticketMessageSchema = new Schema({
  sender: {
    type: String,
    enum: ["CUSTOMER", "ADMIN"],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ticketSchema = new Schema<TicketDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    messages: [ticketMessageSchema],
  },
  { timestamps: true },
);

ticketSchema.pre("save", function (next) {
  if (!this.ticketNumber) {
    this.ticketNumber = "TK-" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
  }
  next();
});

const Ticket = mongoose.model<TicketDocument>("Ticket", ticketSchema);
export default Ticket;
