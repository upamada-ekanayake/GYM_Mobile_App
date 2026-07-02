const mongoose = require('mongoose');

const supplementSchema = new mongoose.Schema({
    SupplementName: {
        type: String,
        required: true,
    },
    SupplementBrand: {
        type: String,
        required: true,
    },
    SupplementType: {
        type: String,
        required: true,
    },
    SupplementDescription: {
        type: String,
        required: true,
    },
    SupplementPrice: {
        type: Number,
        required: true,
    },
    SupplementStock: {
        type: Number,
        required: true,
    },
    SupplementAvailable: {
        type: Boolean,
        default: true,
    },
    SupplementImage: {
        type: String,
        required: true,
    },

}, { timestamps: true });

module.exports = mongoose.model('Supplement', supplementSchema);