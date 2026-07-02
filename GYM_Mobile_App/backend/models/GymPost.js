const mongoose = require('mongoose');

const gymInfoSchema = new mongoose.Schema({
    gymId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Gym',
        required: true,
    },
    gymInformation: {
        type: String,
        required: true,
    },
    gymFacilities: [
        {
            facility: {
                type: String,
                required: true,
            }
        }
    ],
    openHours: {
        type: String,
        required: true,
    },
    closeHours: {
        type: String,
        required: true,
    },
    gymContactNumber: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    packages: [
        {
            packageName: {
                type: String,
                required: true,
            },
            packagePrice: {
                type: Number,
                required: true,
            },
            packageDuration: {
                type: String,
                required: true,
            },
            features: {
                type: [String],
                required: true,
            }
        }
    ],
    gymImg: {
        type: String,
        required: true,
    }

}, { timestamps: true });

module.exports = mongoose.model('GymPost', gymInfoSchema);
