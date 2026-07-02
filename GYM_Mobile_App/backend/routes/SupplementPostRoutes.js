const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
router.use(authMiddleware);
const SupplementPostController = require('../controllers/SupplementPostController');

router.post('/supplement-post-create/:adminId', SupplementPostController.Supplement_Create);
router.patch('/supplement-post-update-name/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Name);
router.patch('/supplement-post-update-brand/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Brand);
router.patch('/supplement-post-update-type/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Type);
router.patch('/supplement-post-update-description/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Description);
router.patch('/supplement-post-update-price/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Price);
router.patch('/supplement-post-update-stock/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Stock);
router.patch('/supplement-post-update-image/:supplementPostId/:adminId', SupplementPostController.Supplement_Update_Image);
router.get('/supplement-post-get-by-id/:supplementPostId', SupplementPostController.Supplement_Get_Details_By_Supplement_Id);
router.get('/supplement-post-get-all', SupplementPostController.Supplement_Get_All);
router.delete('/supplement-post-delete/:supplementPostId/:adminId', SupplementPostController.Supplement_Delete);
router.get('/supplement-price-by-supplement-id/:supplementPostId', SupplementPostController.Supplement_Price_By_Supplement_Id);
router.patch('/supplement-buy/:supplementPostId', SupplementPostController.Supplement_Buy);

module.exports = router;    