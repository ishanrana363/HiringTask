const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const todoSchema = new Schema({
    Title: {
        type: String,
        required: true,
        trim: true
    },
    Description: {
        type: String,
        trim: true
    },
    Date: {
        type: Date,
        default: Date.now
    },
    Status: {
        type: String,
        enum: ["Pending", "Completed"],
        default: "Pending"
    },
    Priority: {
        type: String,
        enum: ["High", "Medium", "Low"],
        default: "Medium"
    }
}, { timestamps: true, versionKey: false });

const todoModel = model("todo", todoSchema);

module.exports = todoModel;