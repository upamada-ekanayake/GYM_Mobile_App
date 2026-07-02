const mongoose = require('mongoose');

const coachpostSchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coach',
        required: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    experience: {
        type: String,
        required: true,
    },
    fee: {
        type: Number,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    postimage: {
        type: String,
        required: false,
        default: null,
    },

}, { timestamps: true });

module.exports = mongoose.model('Coachpost', coachpostSchema);
