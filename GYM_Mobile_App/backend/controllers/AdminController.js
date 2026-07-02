const { auth, db } = require('../config/firebase');
const axios = require('axios');
require('dotenv').config();

// Helper to verify current password using Google Identity Toolkit API
const verifyPassword = async (email, password) => {
    try {
        await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
            { email, password, returnSecureToken: true }
        );
        return true;
    } catch (error) {
        return false;
    }
};

// --- 01. Admin Registration --- //
exports.Admin_Registration = async (req, res) => {
    try {
        const { AdminName, AdminAge, AdminNIC, AdminContactNumber, Email, Password, ConfirmPassword, AdminDP } = req.body;

        // Validation
        if (!AdminName || !AdminAge || !AdminNIC || !AdminContactNumber || !Email || !Password || !ConfirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (AdminContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }
        if (Password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Check if email already registered in Firestore
        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (!checkEmail.empty) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: Email,
            password: Password,
            displayName: AdminName
        });

        // Save metadata in users collection
        const adminData = {
            AdminName,
            AdminAge: Number(AdminAge),
            AdminNIC,
            AdminContactNumber,
            Email,
            AdminDP: AdminDP || null,
            Role: 'Admin',
            Approve: false
        };

        await db.collection('users').doc(userRecord.uid).set(adminData);

        res.status(201).json({
            message: 'Admin registered successfully',
            newAdmin: { _id: userRecord.uid, ...adminData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Admin Login --- //
exports.Admin_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        if (!Email || !Password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Verify with Identity Toolkit
        let authData;
        try {
            const authRes = await axios.post(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
                { email: Email, password: Password, returnSecureToken: true }
            );
            authData = authRes.data;
        } catch (authError) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const uid = authData.localId;
        const token = authData.idToken;

        // Fetch Firestore metadata
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Profile not found in database' });
        }

        const adminData = userDoc.data();

        // Check if admin is approved
        if (!adminData.Approve) {
            return res.status(400).json({ message: 'Admin is not approved yet' });
        }

        res.status(200).json({
            message: 'Login successfully',
            admin: { _id: uid, ...adminData },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Update Contact Number --- //
exports.Admin_UpdateContactNumber = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { newContactNumber } = req.body;

        if (!newContactNumber || newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await adminRef.update({ AdminContactNumber: newContactNumber });
        const updatedDoc = await adminRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            update_admin: { _id: adminId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Update Password --- //
exports.Admin_UpdatePassword = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify old password
        const email = adminDoc.data().Email;
        const isCorrect = await verifyPassword(email, oldPassword);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'New passwords are not matching' });
        }

        // Update password in Firebase Auth
        await auth.updateUser(adminId, { password: newPassword });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update Admin DP --- //
exports.Admin_UpdateDP = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { AdminDP } = req.body;

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await adminRef.update({ AdminDP: AdminDP || null });
        const updatedDoc = await adminRef.get();

        res.status(200).json({
            message: 'Admin DP updated successfully',
            update_admin: { _id: adminId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Get Admin Role --- //
exports.Admin_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (checkEmail.empty) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const adminDoc = checkEmail.docs[0];
        res.status(200).json({ role: adminDoc.data().Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Get Admin Details --- //
exports.Admin_Details = async (req, res) => {
    try {
        const { adminId } = req.params;

        const adminDoc = await db.collection('users').doc(adminId).get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({
            admin: { _id: adminId, ...adminDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Delete Admin --- //
exports.Admin_Delete = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { Password } = req.body;

        const adminRef = db.collection('users').doc(adminId);
        const adminDoc = await adminRef.get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Verify password
        const email = adminDoc.data().Email;
        const isCorrect = await verifyPassword(email, Password);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Delete from Firebase Auth
        await auth.deleteUser(adminId);

        // Delete from Firestore
        await adminRef.delete();

        res.status(200).json({
            message: 'Admin deleted successfully',
            delete_admin: { _id: adminId, ...adminDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Admin Approval Status --- //
exports.Admin_GetAdminApprovalStatus = async (req, res) => {
    try {
        const { adminId } = req.params;

        const adminDoc = await db.collection('users').doc(adminId).get();
        if (!adminDoc.exists) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ approvalStatus: adminDoc.data().Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};