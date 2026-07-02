const { db } = require('../config/firebase');

// Check if admin is valid and approved in Firestore
const checkAdmin = async (adminId) => {
    const adminDoc = await db.collection('users').doc(adminId).get();
    if (!adminDoc.exists) return null;
    const admin = adminDoc.data();
    if (admin.Role !== 'Admin') return null;
    return admin;
};

// --- 01. Create a new supplement Post --- //
exports.Supplement_Create = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { SupplementName, SupplementBrand, SupplementType, SupplementDescription, SupplementPrice, SupplementStock, SupplementImage } = req.body;

        const admin = await checkAdmin(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or invalid' });
        }
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        const price = Number(SupplementPrice) || 0;
        const stock = Number(SupplementStock) || 0;

        if (price <= 0) {
            return res.status(400).json({ message: 'Supplement price must be greater than 0' });
        }
        if (stock < 0) {
            return res.status(400).json({ message: 'Supplement stock must be greater than 0' });
        }

        const SupplementAvailable = stock > 0;

        const supplementData = {
            SupplementName,
            SupplementBrand,
            SupplementType,
            SupplementDescription,
            SupplementPrice: price,
            SupplementStock: stock,
            SupplementAvailable,
            SupplementImage: SupplementImage || null
        };

        const postRef = await db.collection('supplementPosts').add(supplementData);

        res.status(201).json({
            message: 'Supplement created successfully',
            supplement: { _id: postRef.id, ...supplementData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Helper for updating supplement post fields
const updateSupplementField = async (req, res, fieldName, successMsg) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const value = req.body[fieldName];

        const admin = await checkAdmin(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or invalid' });
        }
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        const postRef = db.collection('supplementPosts').doc(supplementPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        await postRef.update({ [fieldName]: value });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: successMsg,
            [`update_${fieldName}`]: { _id: supplementPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Update Supplement Name --- //
exports.Supplement_Update_Name = async (req, res) => {
    await updateSupplementField(req, res, 'SupplementName', 'Supplement name updated successfully');
};

// --- 03. Update Supplement Brand --- //
exports.Supplement_Update_Brand = async (req, res) => {
    await updateSupplementField(req, res, 'SupplementBrand', 'Supplement brand updated successfully');
};

// --- 04. Update Supplement Type --- //
exports.Supplement_Update_Type = async (req, res) => {
    await updateSupplementField(req, res, 'SupplementType', 'Supplement type updated successfully');
};

// --- 05. Update Supplement Description --- //
exports.Supplement_Update_Description = async (req, res) => {
    await updateSupplementField(req, res, 'SupplementDescription', 'Supplement description updated successfully');
};

// --- 06. Update Supplement Price --- //
exports.Supplement_Update_Price = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementPrice } = req.body;

        const admin = await checkAdmin(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or invalid' });
        }
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        const price = Number(SupplementPrice) || 0;
        if (price <= 0) {
            return res.status(400).json({ message: 'Supplement price must be greater than 0' });
        }

        const postRef = db.collection('supplementPosts').doc(supplementPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        await postRef.update({ SupplementPrice: price });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Supplement price updated successfully',
            update_supplementPrice: { _id: supplementPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Update Supplement Stock --- //
exports.Supplement_Update_Stock = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementStock } = req.body;

        const admin = await checkAdmin(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or invalid' });
        }
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        const stock = Number(SupplementStock);
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ message: 'Supplement stock must be greater than or equal to 0' });
        }

        const postRef = db.collection('supplementPosts').doc(supplementPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        const SupplementAvailable = stock > 0;
        await postRef.update({ SupplementStock: stock, SupplementAvailable });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Supplement stock updated successfully',
            update_supplementStock: { _id: supplementPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Update Supplement Image --- //
exports.Supplement_Update_Image = async (req, res) => {
    await updateSupplementField(req, res, 'SupplementImage', 'Supplement image updated successfully');
};

// --- 09. Get Supplement Details By Supplement post Id -- //
exports.Supplement_Get_Details_By_Supplement_Id = async (req, res) => {
    try {
        const { supplementPostId } = req.params;

        const postDoc = await db.collection('supplementPosts').doc(supplementPostId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        res.status(200).json({
            message: 'Supplement post details found successfully',
            Supplement: { _id: supplementPostId, ...postDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Get All Supplement Posts -- //
exports.Supplement_Get_All = async (req, res) => {
    try {
        const postsSnap = await db.collection('supplementPosts').get();
        const Supplement = [];
        postsSnap.forEach(doc => {
            Supplement.push({ _id: doc.id, ...doc.data() });
        });

        res.status(200).json({
            message: 'Supplement posts details found successfully',
            Supplement
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Delete Supplement Post --- //
exports.Supplement_Delete = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;

        const admin = await checkAdmin(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found or invalid' });
        }
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        const postRef = db.collection('supplementPosts').doc(supplementPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        await postRef.delete();

        res.status(200).json({
            message: 'Supplement deleted successfully',
            delete_supplement: { _id: supplementPostId, ...postDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 12. Get Supplement Price By Supplement Id -- //
exports.Supplement_Price_By_Supplement_Id = async (req, res) => {
    try {
        const { supplementPostId } = req.params;

        const postDoc = await db.collection('supplementPosts').doc(supplementPostId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement not found' });
        }

        res.status(200).json({
            message: 'Supplement price by supplement id found successfully',
            SupplementPrice: postDoc.data().SupplementPrice
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 13. Buy Supplement -- //
exports.Supplement_Buy = async (req, res) => {
    try {
        const { supplementPostId } = req.params;
        const { CradNumber, ExpiryDate, CVV, Amount, Quantity } = req.body;

        const postRef = db.collection('supplementPosts').doc(supplementPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Supplement not found' });
        }

        const supplementData = postDoc.data();

        if (!supplementData.SupplementAvailable) {
            return res.status(404).json({ message: 'Supplement not available' });
        }
        if (supplementData.SupplementStock <= 0) {
            return res.status(404).json({ message: 'Supplement stock is 0' });
        }

        // Mock verification validation rules
        if (CradNumber !== 1234123412341234) {
            return res.status(404).json({ message: 'Invalid Card Number' });
        }
        if (ExpiryDate !== "12/26") {
            return res.status(404).json({ message: 'Invalid Expiry Date' });
        }
        if (CVV !== 123) {
            return res.status(404).json({ message: 'Invalid CVV' });
        }
        if (Number(Amount) !== supplementData.SupplementPrice * Quantity) {
            return res.status(404).json({ message: 'Invalid Amount' });
        }

        const newStock = Math.max(0, supplementData.SupplementStock - Quantity);
        const SupplementAvailable = newStock > 0;

        await postRef.update({
            SupplementStock: newStock,
            SupplementAvailable
        });

        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Supplement bought successfully',
            updated_supplement: { _id: supplementPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
