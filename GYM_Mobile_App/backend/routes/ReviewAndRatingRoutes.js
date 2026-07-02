const express = require('express');
const router = express.Router();
const ReviewAndRatingController = require('../controllers/ReviewAndRatingController');


router.post('/review-and-rating-create/:PersonID', ReviewAndRatingController.createReviewAndRating);
router.patch('/review-and-rating-update/:ReviewAndRatingID/:PersonID', ReviewAndRatingController.updateReviewAndRating);
router.get('/review-and-rating-get-by-person-id/:PersonID', ReviewAndRatingController.getReviewAndRatingByPersonID);
router.get('/review-and-rating-get-all', ReviewAndRatingController.getAllReviewAndRating);
router.delete('/review-and-rating-delete-by-person-id/:ReviewAndRatingID/:PersonID', ReviewAndRatingController.deleteReviewAndRatingByPersonID);
router.delete('/review-and-rating-delete-by-id-admin-only/:ReviewAndRatingID/:AdminID', ReviewAndRatingController.deleteReviewAndRatingByIDAdminOnly);

module.exports = router;