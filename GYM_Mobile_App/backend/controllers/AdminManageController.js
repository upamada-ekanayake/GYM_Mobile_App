const { auth, db } = require('../config/firebase');

// Helper to check if logged in admin is approved
const checkAdminApproved = async (adminId) => {
    const doc = await db.collection('users').doc(adminId).get();
    if (!doc.exists) return false;
    const data = doc.data();
    return data.Role === 'Admin' && data.Approve === true;
};

// Helper for changing approval status in users collection
const changeApproveStatus = async (req, res, targetId, loginAdminId, roleName, successMsg) => {
    try {
        const isAdminApproved = await checkAdminApproved(loginAdminId);
        if (!isAdminApproved) {
            return res.status(403).json({ message: 'You need access' });
        }

        const userRef = db.collection('users').doc(targetId);
        const userDoc = await userRef.get();
        if (!userDoc.exists || userDoc.data().Role !== roleName) {
            return res.status(404).json({ message: `${roleName} not found` });
        }

        const { Approve } = req.body;
        await userRef.update({ Approve: Boolean(Approve) });
        
        const updatedDoc = await userRef.get();

        res.status(200).json({
            message: successMsg,
            [roleName.toLowerCase()]: { _id: targetId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Helper for deleting profiles and their auth accounts
const deleteProfile = async (req, res, targetId, loginAdminId, roleName, successMsg) => {
    try {
        const isAdminApproved = await checkAdminApproved(loginAdminId);
        if (!isAdminApproved) {
            return res.status(403).json({ message: 'You need access' });
        }

        const userRef = db.collection('users').doc(targetId);
        const userDoc = await userRef.get();
        if (!userDoc.exists || userDoc.data().Role !== roleName) {
            return res.status(404).json({ message: `${roleName} not found` });
        }

        // Delete from Firebase Auth
        try {
            await auth.deleteUser(targetId);
        } catch (authErr) {
            // Ignore if auth user doesn't exist anymore
        }

        // Delete from Firestore
        await userRef.delete();

        res.status(200).json({
            message: successMsg,
            [roleName.toLowerCase()]: { _id: targetId, ...userDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 01. Get all users details --- //
exports.AdminManage_GetAllUsersDetails = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'User').get();
        const users = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({ message: 'Users found', users });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Get all gyms details --- //
exports.AdminManage_GetAllGymsDetails = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Gym').get();
        const gyms = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({ message: 'Gyms found', gyms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Get all coaches details --- //
exports.AdminManage_GetAllCoachesDetails = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Coach').get();
        const coaches = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({ message: 'Coaches found', coaches });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Get all admins details --- //
exports.AdminManage_GetAllAdminsDetails = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Admin').get();
        const admins = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({ message: 'Admins found', admins });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Change Approve for user --- //
exports.AdminManage_ChangeApproveForUser = async (req, res) => {
    await changeApproveStatus(req, res, req.params.userId, req.params.loginAdminId, 'User', 'User approve changed');
};

// --- 06. Change Approve for gym --- //
exports.AdminManage_ChangeApproveForGym = async (req, res) => {
    await changeApproveStatus(req, res, req.params.gymId, req.params.loginAdminId, 'Gym', 'Gym approve changed');
};

// --- 07. Change Approve for coach --- //
exports.AdminManage_ChangeApproveForCoach = async (req, res) => {
    await changeApproveStatus(req, res, req.params.coachId, req.params.loginAdminId, 'Coach', 'Coach approve changed');
};

// --- 08. Change Approve for admin --- //
exports.AdminManage_ChangeApproveForAdmin = async (req, res) => {
    await changeApproveStatus(req, res, req.params.adminId, req.params.loginAdminId, 'Admin', 'Admin approve changed');
};

// --- 09. Sort up to approve false users --- //
exports.AdminManage_SortUpToApproveFalesUsers = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'User').where('Approve', '==', false).get();
        const users = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.status(200).json({ message: 'Users found', users });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Sort up to approve false gyms --- //
exports.AdminManage_SortUpToApproveFalesGyms = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Gym').where('Approve', '==', false).get();
        const gyms = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.status(200).json({ message: 'Gyms found', gyms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Sort up to approve false coaches --- //
exports.AdminManage_SortUpToApproveFalesCoaches = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Coach').where('Approve', '==', false).get();
        const coaches = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.status(200).json({ message: 'Coaches found', coaches });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 12. Sort up to approve false admins --- //
exports.AdminManage_SortUpToApproveFalesAdmins = async (req, res) => {
    try {
        const querySnap = await db.collection('users').where('Role', '==', 'Admin').where('Approve', '==', false).get();
        const admins = querySnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
        res.status(200).json({ message: 'Admins found', admins });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 13. Delete User --- //
exports.AdminManage_DeleteUser = async (req, res) => {
    await deleteProfile(req, res, req.params.userId, req.params.loginAdminId, 'User', 'User deleted');
};

// --- 14. Delete Gym --- //
exports.AdminManage_DeleteGym = async (req, res) => {
    await deleteProfile(req, res, req.params.gymId, req.params.loginAdminId, 'Gym', 'Gym deleted');
};

// --- 15. Delete Coach --- //
exports.AdminManage_DeleteCoach = async (req, res) => {
    await deleteProfile(req, res, req.params.coachId, req.params.loginAdminId, 'Coach', 'Coach deleted');
};

// --- 16. Delete Admin --- //
exports.AdminManage_DeleteAdmin = async (req, res) => {
    await deleteProfile(req, res, req.params.adminId, req.params.loginAdminId, 'Admin', 'Admin deleted');
};