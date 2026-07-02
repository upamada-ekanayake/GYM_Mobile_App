const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    AdminName: {
        type: String,
        required: true,
    },
    AdminAge: {
        type: Number,
        required: true,
    },
    AdminNIC: {
        type: String,
        required: true,
        unique: true,
    },
    AdminContactNumber: {
        type: String,
        required: true,
    },
    Email: {
        type: String,
        required: true,
        unique: true,
    },
    Password: {
        type: String,
        required: true,
    },
    AdminDP: {
        type: String,
        required: false,
        default: null,
    },
    Role: {
        type: String,
        required: true,
    },
    Approve: {
        type: Boolean,
        default: false,
        required: true,
    },

}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);