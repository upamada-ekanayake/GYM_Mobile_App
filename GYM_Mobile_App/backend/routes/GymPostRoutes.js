const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);
const GymPostController = require('../controllers/GymPostController');

router.post('/gym-post-create/:gymId', GymPostController.createGymPost);
router.patch('/gym-post-information-update/:gymPostId', GymPostController.updateGymPostInformation);
router.patch('/gym-post-facilities-add/:gymPostId', GymPostController.addGymFacilities);
router.delete('/gym-post-facilities-delete/:gymPostId', GymPostController.deleteGymFacilities);
router.patch('/gym-post-open-hours-update/:gymPostId', GymPostController.updateOpenHours);
router.patch('/gym-post-close-hours-update/:gymPostId', GymPostController.updateCloseHours);
router.patch('/gym-post-contact-number-update/:gymPostId', GymPostController.updateGymPostContactNumber);
router.patch('/gym-post-city-update/:gymPostId', GymPostController.updateCity);
router.patch('/gym-post-add-package/:gymPostId', GymPostController.addGymPackage);
router.delete('/gym-post-delete-package/:gymPostId', GymPostController.deleteGymPackages);
router.patch('/gym-post-image-update/:gymPostId', GymPostController.updateGymPostImage);
router.delete('/gym-post-delete/:gymPostId', GymPostController.deleteGymPost);
router.get('/gym-post-get-by-gympost-id/:gymPostId', GymPostController.getGymPostByGymPostId);
router.get('/gym-post-get-by-gym-id/:gymId', GymPostController.getGymPostByGymId);
router.get('/gym-post-get-all', GymPostController.getAllGymPosts);

module.exports = router;