const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);
const CoachPostController = require('../controllers/CoachPostController');

router.post('/coach-post-create/:coachId', CoachPostController.createCoachPost);
router.patch('/coach-post-description/:coachPostId', CoachPostController.updateDescription);
router.patch('/coach-post-experience/:coachPostId', CoachPostController.updateExperience);
router.patch('/coach-post-fee/:coachPostId', CoachPostController.updateFee);
router.patch('/coach-post-duration/:coachPostId', CoachPostController.updateDuration);
router.patch('/coach-post-contact-number/:coachPostId', CoachPostController.updateContactNumber);
router.patch('/coach-post-image/:coachPostId', CoachPostController.updatePostImage);
router.delete('/coach-post-delete/:coachPostId', CoachPostController.deleteCoachPost);
router.get('/coach-post-get-by-coach-id/:coachId', CoachPostController.getCoachPostByCoachId);
router.get('/coach-post-get-all', CoachPostController.getAllCoachPosts);

module.exports = router;