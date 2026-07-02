const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    UserName: {
        type: String,
        required: true,
    },
    UserAge: {
        type: Number,
        required: true,
    },
    UserNIC: {
        type: String,
        required: true,
        unique: true,
    },
    UserContactNumber: {
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
    UserDP: {
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
        default: true,
        required: true,
    },
    Workouts: [
        {
            workoutName: {
                type: String,
                required: true,
            },
            sets: {
                type: Number,
                required: true,
            },
            reps: {
                type: Number,
                required: true,
            },
            weight: {
                type: Number,
                required: true,
            },
            duration: {
                type: Number,
                required: true,
            },
        }
    ],

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);