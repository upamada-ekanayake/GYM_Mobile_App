const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const ReviewAndRating = require('../models/ReviewAndRating');

// --- 01. Create Review and Rating --- //

exports.createReviewAndRating = async (req, res) => {
    try {
        const { PersonID } = req.params;
        const { Review, Rating } = req.body;

        // Check The Person is exist or not
        let user = await User.findById(PersonID);
        if (!user) {
            let admin = await Admin.findById(PersonID);
            if (!admin) {
                let gym = await Gym.findById(PersonID);
                if (!gym) {
                    let coach = await Coach.findById(PersonID);
                    if (!coach) {
                        return res.status(404).json({ message: 'Person not found' });
                    }
                }
            }
        }

        // Rating must be between 1 to 5
        if (Rating < 1 || Rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 to 5' });
        }

        const newReviewAndRating = new ReviewAndRating({ PersonID, Review, Rating });
        await newReviewAndRating.save();

        res.status(201).json({ message: 'Review and rating created successfully', reviewAndRating: newReviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Update Review and Rating --- //

exports.updateReviewAndRating = async (req, res) => {
    try {
        const { ReviewAndRatingID, PersonID } = req.params;
        const { Review, Rating } = req.body;

        // Check The Person is exist or not
        let user = await User.findById(PersonID);
        if (!user) {
            let admin = await Admin.findById(PersonID);
            if (!admin) {
                let gym = await Gym.findById(PersonID);
                if (!gym) {
                    let coach = await Coach.findById(PersonID);
                    if (!coach) {
                        return res.status(404).json({ message: 'Person not found' });
                    }
                }
            }
        }

        // Rating must be between 1 to 5
        if (Rating < 1 || Rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 to 5' });
        }

        let reviewAndRating = await ReviewAndRating.findById(ReviewAndRatingID);
        if (!reviewAndRating) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        if (reviewAndRating.PersonID !== PersonID) {
            return res.status(401).json({ message: 'You are not authorized to update this review and rating' });
        }

        const updateReviewAndRating = await ReviewAndRating.findOneAndUpdate(
            { PersonID: PersonID },
            { $set: { Review: Review, Rating: Rating } },
            { returnDocument: 'after' }
        );
        if (!updateReviewAndRating) {
            return res.status(404).json({ message: 'Failed to update review and rating' });
        }

        res.status(200).json({ message: 'Review and rating updated successfully', updateReviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Get Review and Rating by PersonID --- //

exports.getReviewAndRatingByPersonID = async (req, res) => {
    try {
        const { PersonID } = req.params;

        // Check The Person is exist or not
        let user = await User.findById(PersonID);
        if (!user) {
            let admin = await Admin.findById(PersonID);
            if (!admin) {
                let gym = await Gym.findById(PersonID);
                if (!gym) {
                    let coach = await Coach.findById(PersonID);
                    if (!coach) {
                        return res.status(404).json({ message: 'Person not found' });
                    }
                }
            }
        }

        const reviewAndRating = await ReviewAndRating.find({ PersonID: PersonID });
        if (!reviewAndRating) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        res.status(200).json({ message: 'Review and rating found successfully', reviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Get All Review and Rating --- //

exports.getAllReviewAndRating = async (req, res) => {
    try {

        const reviewAndRating = await ReviewAndRating.find();

        if (!reviewAndRating || reviewAndRating.length === 0) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        res.status(200).json({ message: 'Review and rating found successfully', reviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Delete Review and Rating By PersonID --- //

exports.deleteReviewAndRatingByPersonID = async (req, res) => {
    try {
        const { ReviewAndRatingID, PersonID } = req.params;

        // Check The Person is exist or not
        let user = await User.findById(PersonID);
        if (!user) {
            let admin = await Admin.findById(PersonID);
            if (!admin) {
                let gym = await Gym.findById(PersonID);
                if (!gym) {
                    let coach = await Coach.findById(PersonID);
                    if (!coach) {
                        return res.status(404).json({ message: 'Person not found' });
                    }
                }
            }
        }

        let reviewAndRating = await ReviewAndRating.findById(ReviewAndRatingID);
        if (!reviewAndRating) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        if (reviewAndRating.PersonID !== PersonID) {
            return res.status(401).json({ message: 'You are not authorized to update this review and rating' });
        }

        let deleteReviewAndRating = await ReviewAndRating.findOneAndDelete(
            { PersonID: PersonID }
        );

        if (!deleteReviewAndRating) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        res.status(200).json({ message: 'Review and rating deleted successfully', deleteReviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Delete Review and Rating By ID Admin Only --- //

exports.deleteReviewAndRatingByIDAdminOnly = async (req, res) => {
    try {
        const { ReviewAndRatingID, AdminID } = req.params;

        // Check The Admin is exist or not
        let admin = await Admin.findById(AdminID);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved, So you cant delete review and rating' });
        }

        const reviewAndRating = await ReviewAndRating.findByIdAndDelete(ReviewAndRatingID);
        if (!reviewAndRating) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        res.status(200).json({ message: 'Review and rating deleted successfully', reviewAndRating });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};