const { auth, db, admin } = require('../config/firebase');
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

// --- 01. User Registration --- //
exports.User_Registration = async (req, res) => {
    try {
        const { 
            UserName, 
            UserAge, 
            UserNIC, 
            UserContactNumber, 
            Email, 
            Password, 
            ConfirmPassword, 
            UserDP,
            UserWeight,
            UserHeight,
            Gender,
            ActivityLevel,
            WorkoutGoal,
            WaterTarget,
            CalorieTarget
        } = req.body;

        // Validation
        if (!UserName || !UserAge || !UserNIC || !UserContactNumber || !Email || !Password || !ConfirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Check if user already exists in Firestore
        const userCheck = await db.collection('users').where('Email', '==', Email).get();
        if (!userCheck.empty) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create Firebase Auth user
        const userRecord = await auth.createUser({
            email: Email,
            password: Password,
            displayName: UserName
        });

        // Save profile in Firestore users collection
        const userData = {
            UserName,
            UserAge: Number(UserAge),
            UserNIC,
            UserContactNumber,
            Email,
            UserDP: UserDP || null,
            Role: 'User',
            Approve: true,
            Workouts: [],
            UserWeight: UserWeight ? Number(UserWeight) : null,
            UserHeight: UserHeight ? Number(UserHeight) : null,
            Gender: Gender || null,
            ActivityLevel: ActivityLevel || null,
            WorkoutGoal: WorkoutGoal || null,
            WaterTarget: WaterTarget ? Number(WaterTarget) : null,
            CalorieTarget: CalorieTarget ? Number(CalorieTarget) : null,
            WaterLog: [],
            CalorieLog: []
        };

        await db.collection('users').doc(userRecord.uid).set(userData);

        res.status(201).json({
            message: 'User registered successfully',
            newUser: { _id: userRecord.uid, ...userData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. User Login --- //
exports.User_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        if (!Email || !Password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Authenticate with Google Identity Toolkit REST API
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
            return res.status(404).json({ message: 'Profile data not found in database' });
        }

        const userData = userDoc.data();

        res.status(200).json({
            message: 'Login successfully',
            user: { _id: uid, ...userData },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Update Contact Number --- //
exports.User_UpdateContactNumber = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newContactNumber } = req.body;

        if (!newContactNumber || newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userRef.update({ UserContactNumber: newContactNumber });
        const updatedDoc = await userRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            update_user: { _id: userId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Update Password --- //
exports.User_UpdatePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify old password
        const email = userDoc.data().Email;
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
        await auth.updateUser(userId, { password: newPassword });

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update User DP --- //
exports.User_UpdateDP = async (req, res) => {
    try {
        const { userId } = req.params;
        const { UserDP } = req.body;

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        await userRef.update({ UserDP: UserDP || null });
        const updatedDoc = await userRef.get();

        res.status(200).json({
            message: 'User DP updated successfully',
            update_dp: { _id: userId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Get User Role --- //
exports.User_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        const userCheck = await db.collection('users').where('Email', '==', Email).get();
        if (userCheck.empty) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userDoc = userCheck.docs[0];
        res.status(200).json({ role: userDoc.data().Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Get User Details --- //
exports.User_Details = async (req, res) => {
    try {
        const { userId } = req.params;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            user: { _id: userId, ...userDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Delete User --- //
exports.User_Detele = async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password
        const email = userDoc.data().Email;
        const isCorrect = await verifyPassword(email, password);
        if (!isCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Delete from Firebase Auth
        await auth.deleteUser(userId);

        // Delete from Firestore
        await userRef.delete();

        res.status(200).json({
            message: 'User deleted successfully',
            delete_user: { _id: userId, ...userDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get User Approval Status --- //
exports.User_GetUserApprovalStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ approvalStatus: userDoc.data().Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Log Water Intake --- //
exports.User_LogWater = async (req, res) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;

        if (!amount || isNaN(Number(amount))) {
            return res.status(400).json({ message: 'Valid water amount is required' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const timestamp = new Date().toISOString();
        const entry = { timestamp, amount: Number(amount) };

        await userRef.update({
            WaterLog: admin.firestore.FieldValue.arrayUnion(entry)
        });

        res.status(200).json({
            message: 'Water logged successfully',
            entry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Log Calorie Intake --- //
exports.User_LogCalorie = async (req, res) => {
    try {
        const { userId } = req.params;
        const { foodName, calories } = req.body;

        if (!foodName || calories === undefined || isNaN(Number(calories))) {
            return res.status(400).json({ message: 'Food name and valid calorie values are required' });
        }

        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const timestamp = new Date().toISOString();
        const entry = { timestamp, foodName, calories: Number(calories) };

        await userRef.update({
            CalorieLog: admin.firestore.FieldValue.arrayUnion(entry)
        });

        res.status(200).json({
            message: 'Calorie logged successfully',
            entry
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};