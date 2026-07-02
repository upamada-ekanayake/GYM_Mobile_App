const { db } = require('../config/firebase');

// Helper to verify that a person profile document exists in the unified users collection
const checkPersonExists = async (personId) => {
    const doc = await db.collection('users').doc(personId).get();
    return doc.exists;
};

// Helper to check if admin is approved
const checkAdminApproved = async (adminId) => {
    const doc = await db.collection('users').doc(adminId).get();
    if (!doc.exists) return false;
    const data = doc.data();
    return data.Role === 'Admin' && data.Approve === true;
};

// --- 01. Create Review and Rating --- //
exports.createReviewAndRating = async (req, res) => {
    try {
        const { PersonID } = req.params;
        const { Review, Rating } = req.body;

        const exists = await checkPersonExists(PersonID);
        if (!exists) {
            return res.status(404).json({ message: 'Person not found' });
        }

        if (Number(Rating) < 1 || Number(Rating) > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 to 5' });
        }

        const reviewData = {
            PersonID,
            Review,
            Rating: Number(Rating)
        };

        const reviewRef = await db.collection('reviews').add(reviewData);

        res.status(201).json({
            message: 'Review and rating created successfully',
            reviewAndRating: { _id: reviewRef.id, ...reviewData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Update Review and Rating --- //
exports.updateReviewAndRating = async (req, res) => {
    try {
        const { ReviewAndRatingID, PersonID } = req.params;
        const { Review, Rating } = req.body;

        const exists = await checkPersonExists(PersonID);
        if (!exists) {
            return res.status(404).json({ message: 'Person not found' });
        }

        if (Number(Rating) < 1 || Number(Rating) > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 to 5' });
        }

        const reviewRef = db.collection('reviews').doc(ReviewAndRatingID);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        const reviewData = reviewDoc.data();
        if (reviewData.PersonID !== PersonID) {
            return res.status(401).json({ message: 'You are not authorized to update this review and rating' });
        }

        await reviewRef.update({
            Review,
            Rating: Number(Rating)
        });

        const updatedDoc = await reviewRef.get();

        res.status(200).json({
            message: 'Review and rating updated successfully',
            updateReviewAndRating: { _id: ReviewAndRatingID, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Get Review and Rating by PersonID --- //
exports.getReviewAndRatingByPersonID = async (req, res) => {
    try {
        const { PersonID } = req.params;

        const exists = await checkPersonExists(PersonID);
        if (!exists) {
            return res.status(404).json({ message: 'Person not found' });
        }

        const querySnap = await db.collection('reviews').where('PersonID', '==', PersonID).get();
        const reviewAndRating = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({
            message: 'Review and rating found successfully',
            reviewAndRating
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Get All Review and Rating --- //
exports.getAllReviewAndRating = async (req, res) => {
    try {
        const querySnap = await db.collection('reviews').get();
        const reviewAndRating = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        if (reviewAndRating.length === 0) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        res.status(200).json({
            message: 'Review and rating found successfully',
            reviewAndRating
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Delete Review and Rating By PersonID --- //
exports.deleteReviewAndRatingByPersonID = async (req, res) => {
    try {
        const { ReviewAndRatingID, PersonID } = req.params;

        const exists = await checkPersonExists(PersonID);
        if (!exists) {
            return res.status(404).json({ message: 'Person not found' });
        }

        const reviewRef = db.collection('reviews').doc(ReviewAndRatingID);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        const reviewData = reviewDoc.data();
        if (reviewData.PersonID !== PersonID) {
            return res.status(401).json({ message: 'You are not authorized to update this review and rating' });
        }

        await reviewRef.delete();

        res.status(200).json({
            message: 'Review and rating deleted successfully',
            deleteReviewAndRating: { _id: ReviewAndRatingID, ...reviewData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Delete Review and Rating By ID Admin Only --- //
exports.deleteReviewAndRatingByIDAdminOnly = async (req, res) => {
    try {
        const { ReviewAndRatingID, AdminID } = req.params;

        const isAdminApproved = await checkAdminApproved(AdminID);
        if (!isAdminApproved) {
            return res.status(400).json({ message: 'Admin not found or is not approved' });
        }

        const reviewRef = db.collection('reviews').doc(ReviewAndRatingID);
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            return res.status(404).json({ message: 'Review and rating not found' });
        }

        const reviewData = reviewDoc.data();
        await reviewRef.delete();

        res.status(200).json({
            message: 'Review and rating deleted successfully',
            reviewAndRating: { _id: ReviewAndRatingID, ...reviewData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};