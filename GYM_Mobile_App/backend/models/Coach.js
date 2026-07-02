const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
    CoachName: {
        type: String,
        required: true,
    },
    CoachAge: {
        type: Number,
        required: true,
    },
    CoachNIC: {
        type: String,
        required: true,
        unique: true,
    },
    CoachID: {
        type: String,
        required: true,
        unique: true,
    },
    CoachContactNumber: {
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
    CoachDP: {
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

module.exports = mongoose.model('Coach', coachSchema);