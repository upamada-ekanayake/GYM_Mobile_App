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

// --- 01. Gym Registration ---
exports.Gym_Registration = async (req, res) => {
    try {
        const { GymName, GymOwnerName, GymOwnerNIC, GymID, GymAddress, GymOwnerContactNumber, GymType, Email, Password, ConfirmPassword, GymLogo } = req.body;

        // Validation
        if (!GymName || !GymOwnerName || !GymOwnerNIC || !GymID || !GymAddress || !GymOwnerContactNumber || !GymType || !Email || !Password || !ConfirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Ckeck Contact number has 10 digits
        if (GymOwnerContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        // Check if Gym Name or ID or Owner NIC or Email is already registered
        const checkName = await db.collection('users').where('GymName', '==', GymName).get();
        if (!checkName.empty) {
            return res.status(400).json({ message: 'Gym name already registered' });
        }
        const checkNIC = await db.collection('users').where('GymOwnerNIC', '==', GymOwnerNIC).get();
        if (!checkNIC.empty) {
            return res.status(400).json({ message: 'Gym Owner NIC already registered' });
        }
        const checkID = await db.collection('users').where('GymID', '==', GymID).get();
        if (!checkID.empty) {
            return res.status(400).json({ message: 'Gym ID already registered' });
        }
        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (!checkEmail.empty) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check password length
        if (Password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
            email: Email,
            password: Password,
            displayName: GymName
        });

        // Save metadata in users collection
        const gymData = {
            GymName,
            GymOwnerName,
            GymOwnerNIC,
            GymID,
            GymAddress,
            GymOwnerContactNumber,
            GymType,
            Email,
            GymLogo: GymLogo || null,
            Role: 'Gym',
            Approve: false
        };

        await db.collection('users').doc(userRecord.uid).set(gymData);

        res.status(201).json({
            message: 'Gym registered successfully',
            newGym: { _id: userRecord.uid, ...gymData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Gym Login --- //
exports.Gym_Login = async (req, res) => {
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

        // Fetch Firestore profile
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'Profile not found in database' });
        }

        const gymData = userDoc.data();

        res.status(200).json({
            message: 'Login successfully',
            gym: { _id: uid, ...gymData },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Update Contact Number --- //
exports.Gym_UpdateContactNumber = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { newContactNumber } = req.body;

        if (!newContactNumber || newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const gymRef = db.collection('users').doc(gymId);
        const gymDoc = await gymRef.get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        await gymRef.update({ GymOwnerContactNumber: newContactNumber });
        const updatedDoc = await gymRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            update_gym: { _id: gymId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Update Password --- //
exports.Gym_UpdatePassword = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        const gymRef = db.collection('users').doc(gymId);
        const gymDoc = await gymRef.get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Verify old password
        const email = gymDoc.data().Email;
        const isCorrect = await verifyPassword(email, oldPassword);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'New passwords are not same' });
        }

        // Update password in Firebase Auth
        await auth.updateUser(gymId, { password: newPassword });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update Gym DP (Logo) --- //
exports.Gym_UpdateLogo = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { GymLogo } = req.body;

        const gymRef = db.collection('users').doc(gymId);
        const gymDoc = await gymRef.get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        await gymRef.update({ GymLogo: GymLogo || null });
        const updatedDoc = await gymRef.get();

        res.status(200).json({
            message: 'Gym logo updated successfully',
            update_logo: { _id: gymId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Get Gym Role --- //
exports.Gym_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (checkEmail.empty) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const gymDoc = checkEmail.docs[0];
        res.status(200).json({ role: gymDoc.data().Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Get Gym Details --- //
exports.Gym_Details = async (req, res) => {
    try {
        const { gymId } = req.params;

        const gymDoc = await db.collection('users').doc(gymId).get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({
            gym: { _id: gymId, ...gymDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Delete Gym --- //
exports.Gym_Delete = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { password } = req.body;

        const gymRef = db.collection('users').doc(gymId);
        const gymDoc = await gymRef.get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Verify password
        const email = gymDoc.data().Email;
        const isCorrect = await verifyPassword(email, password);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Delete Gym posts in batch from gymPosts
        const postsQuery = await db.collection('gymPosts').where('gymId', '==', gymId).get();
        const batch = db.batch();
        postsQuery.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete from Firebase Auth
        await auth.deleteUser(gymId);

        // Delete from Firestore
        await gymRef.delete();

        res.status(200).json({
            message: 'Gym deleted successfully',
            delete_gym: { _id: gymId, ...gymDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Gym Approval Status --- //
exports.Gym_GetGymApprovalStatus = async (req, res) => {
    try {
        const { gymId } = req.params;

        const gymDoc = await db.collection('users').doc(gymId).get();
        if (!gymDoc.exists) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ approvalStatus: gymDoc.data().Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
