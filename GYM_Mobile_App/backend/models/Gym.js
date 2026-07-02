const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
    GymName: {
        type: String,
        required: true,
        unique: true,
    },
    GymOwnerName: {
        type: String,
        required: true,
    },
    GymOwnerNIC: {
        type: String,
        required: true,
        unique: true,
    },
    GymID: {
        type: String,
        required: true,
        unique: true,
    },
    GymAddress: {
        type: String,
        required: true,
    },
    GymOwnerContactNumber: {
        type: String,
        required: true,
    },
    GymType: {
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
    GymLogo: {
        type: String,
        default: null,
        required: false,
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

module.exports = mongoose.model('Gym', gymSchema);