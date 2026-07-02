const { admin, db } = require('../config/firebase');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify Firebase ID Token
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Fetch user document from Firestore users collection
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const userData = userDoc.data();

        // Attach resolved profile meta to Request
        req.user = {
            userId: decodedToken.uid,
            role: userData.Role,
            email: decodedToken.email,
            approve: userData.Approve
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired Firebase ID token', error: error.message });
    }
};

module.exports = authMiddleware;
