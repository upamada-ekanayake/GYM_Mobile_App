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

// --- 01. Coach Registration --- //
exports.Coach_Registration = async (req, res) => {
    try {
        const { CoachName, CoachAge, CoachNIC, CoachID, CoachContactNumber, Email, Password, ConfirmPassword, CoachDP } = req.body;

        // Validation
        if (!CoachName || !CoachAge || !CoachNIC || !CoachID || !CoachContactNumber || !Email || !Password || !ConfirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (CoachContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }
        if (Password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Check if Coach ID is already taken
        const checkID = await db.collection('users').where('CoachID', '==', CoachID).get();
        if (!checkID.empty) {
            return res.status(400).json({ message: 'Coach ID already registered' });
        }

        // Check if Email already registered in Firestore
        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (!checkEmail.empty) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
            email: Email,
            password: Password,
            displayName: CoachName
        });

        // Save metadata in users collection
        const coachData = {
            CoachName,
            CoachAge: Number(CoachAge),
            CoachNIC,
            CoachID,
            CoachContactNumber,
            Email,
            CoachDP: CoachDP || null,
            Role: 'Coach',
            Approve: false
        };

        await db.collection('users').doc(userRecord.uid).set(coachData);

        res.status(201).json({
            message: 'Coach registered successfully',
            newCoach: { _id: userRecord.uid, ...coachData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Coach Login --- //
exports.Coach_Login = async (req, res) => {
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

        const coachData = userDoc.data();

        res.status(200).json({
            message: 'Login successfully',
            coach: { _id: uid, ...coachData },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Update Contact Number --- //
exports.Coach_UpdateContactNumber = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { newContactNumber } = req.body;

        if (!newContactNumber || newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const coachRef = db.collection('users').doc(coachId);
        const coachDoc = await coachRef.get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        await coachRef.update({ CoachContactNumber: newContactNumber });
        const updatedDoc = await coachRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            update_coach: { _id: coachId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Update Password --- //
exports.Coach_UpdatePassword = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        const coachRef = db.collection('users').doc(coachId);
        const coachDoc = await coachRef.get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Verify old password
        const email = coachDoc.data().Email;
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
        await auth.updateUser(coachId, { password: newPassword });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update Coach DP --- //
exports.Coach_UpdateDP = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { CoachDP } = req.body;

        const coachRef = db.collection('users').doc(coachId);
        const coachDoc = await coachRef.get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        await coachRef.update({ CoachDP: CoachDP || null });
        const updatedDoc = await coachRef.get();

        res.status(200).json({
            message: 'Coach DP updated successfully',
            update_coach: { _id: coachId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Get Coach Role --- //
exports.Coach_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        const checkEmail = await db.collection('users').where('Email', '==', Email).get();
        if (checkEmail.empty) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        const coachDoc = checkEmail.docs[0];
        res.status(200).json({ role: coachDoc.data().Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Get Coach Details --- //
exports.Coach_Details = async (req, res) => {
    try {
        const { coachId } = req.params;

        const coachDoc = await db.collection('users').doc(coachId).get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({
            coach: { _id: coachId, ...coachDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Delete Coach --- //
exports.Coach_Delete = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { Password } = req.body;

        const coachRef = db.collection('users').doc(coachId);
        const coachDoc = await coachRef.get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Verify password
        const email = coachDoc.data().Email;
        const isCorrect = await verifyPassword(email, Password);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Delete coach's posts in batch from coachPosts
        const postsQuery = await db.collection('coachPosts').where('coachId', '==', coachId).get();
        const batch = db.batch();
        postsQuery.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete from Firebase Auth
        await auth.deleteUser(coachId);

        // Delete from Firestore
        await coachRef.delete();

        res.status(200).json({
            message: 'Coach deleted successfully',
            delete_coach: { _id: coachId, ...coachDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Coach Approval Status --- //
exports.Coach_GetCoachApprovalStatus = async (req, res) => {
    try {
        const { coachId } = req.params;

        const coachDoc = await db.collection('users').doc(coachId).get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ approvalStatus: coachDoc.data().Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};