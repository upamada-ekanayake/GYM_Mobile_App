const { db, admin } = require('../config/firebase');

// --- 01. Create Gym Post --- //
exports.createGymPost = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { gymInformation, gymFacilities, openHours, closeHours, gymContactNumber, city, packages, gymImg } = req.body;

        const gymDoc = await db.collection('users').doc(gymId).get();
        if (!gymDoc.exists) {
            return res.status(400).json({ message: 'Gym not found' });
        }

        const gym = gymDoc.data();
        if (!gym.Approve) {
            return res.status(400).json({ message: 'Gym is not approved, So you cant create Gym post' });
        }

        const existingQuery = await db.collection('gymPosts').where('gymId', '==', gymId).get();
        if (!existingQuery.empty) {
            return res.status(400).json({ message: 'Gym already create Information' });
        }

        const formattedFacilities = (gymFacilities || []).map(f => ({
            _id: Math.random().toString(36).substring(2, 11),
            facility: f.facility
        }));

        const formattedPackages = (packages || []).map(p => ({
            _id: Math.random().toString(36).substring(2, 11),
            packageName: p.packageName,
            price: p.price,
            duration: p.duration,
            description: p.description
        }));

        const postData = {
            gymId,
            gymInformation,
            gymFacilities: formattedFacilities,
            openHours,
            closeHours,
            city,
            gymContactNumber,
            packages: formattedPackages,
            gymImg: gymImg || null
        };

        const postRef = await db.collection('gymPosts').add(postData);

        res.status(201).json({
            message: 'Gym Post created successfully',
            gymPost: { _id: postRef.id, ...postData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- Helper to update field in GymPost --- //
const updateGymPostField = async (req, res, fieldName, successMsg) => {
    try {
        const { gymPostId } = req.params;
        const value = req.body[fieldName];

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        await postRef.update({ [fieldName]: value });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: successMsg,
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Update Gym Information --- //
exports.updateGymPostInformation = async (req, res) => {
    await updateGymPostField(req, res, 'gymInformation', 'Gym post Information updated successfully');
};

// --- 03. Add Gym Facilities --- //
exports.addGymFacilities = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { facility } = req.body;

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        const facilityId = Math.random().toString(36).substring(2, 11);
        const facilityObj = { _id: facilityId, facility };

        await postRef.update({
            gymFacilities: admin.firestore.FieldValue.arrayUnion(facilityObj)
        });

        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Gym facility added successfully',
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Delete Gym Facilities --- //
exports.deleteGymFacilities = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { facilityId } = req.body;

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        let facilities = postDoc.data().gymFacilities || [];
        const updated = facilities.filter(f => f._id !== facilityId);

        await postRef.update({ gymFacilities: updated });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Gym facility deleted successfully',
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update Open Hours --- //
exports.updateOpenHours = async (req, res) => {
    await updateGymPostField(req, res, 'openHours', 'Open hours updated successfully');
};

// --- 06. Update Close Hours --- //
exports.updateCloseHours = async (req, res) => {
    await updateGymPostField(req, res, 'closeHours', 'Close hours updated successfully');
};

// --- 07. Update Gym Contact Number --- //
exports.updateGymPostContactNumber = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { gymContactNumber } = req.body;

        if (!gymContactNumber || gymContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        await postRef.update({ gymContactNumber });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Update City --- //
exports.updateCity = async (req, res) => {
    await updateGymPostField(req, res, 'city', 'City updated successfully');
};

// --- 09. Add Package --- //
exports.addGymPackage = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { packageName, price, duration, description } = req.body;

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        const packageId = Math.random().toString(36).substring(2, 11);
        const packageObj = {
            _id: packageId,
            packageName,
            price: Number(price) || 0,
            duration,
            description
        };

        await postRef.update({
            packages: admin.firestore.FieldValue.arrayUnion(packageObj)
        });

        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Gym package added successfully',
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Delete Package --- //
exports.deleteGymPackages = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { packageId } = req.body;

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        let packages = postDoc.data().packages || [];
        const updated = packages.filter(p => p._id !== packageId);

        await postRef.update({ packages: updated });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Gym package deleted successfully',
            gymPost: { _id: gymPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Update Gym Image --- //
exports.updateGymPostImage = async (req, res) => {
    await updateGymPostField(req, res, 'gymImg', 'Gym post image updated successfully');
};

// --- 12. Delete Gym Post --- //
exports.deleteGymPost = async (req, res) => {
    try {
        const { gymPostId } = req.params;

        const postRef = db.collection('gymPosts').doc(gymPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Gym post not found' });
        }

        await postRef.delete();

        res.status(200).json({ message: 'Gym post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 13. Get Gym Post Details by GymPost ID --- //
exports.getGymPostByGymPostId = async (req, res) => {
    try {
        const { gymPostId } = req.params;

        const postDoc = await db.collection('gymPosts').doc(gymPostId).get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Gym post not found' });
        }

        res.status(200).json({
            gymPost: { _id: gymPostId, ...postDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 14. Get Gym Post by Gym ID --- //
exports.getGymPostByGymId = async (req, res) => {
    try {
        const { gymId } = req.params;

        const postsQuery = await db.collection('gymPosts').where('gymId', '==', gymId).get();
        if (postsQuery.empty) {
            return res.status(404).json({ message: 'No gym post found' });
        }

        const postDoc = postsQuery.docs[0];
        const gymDoc = await db.collection('users').doc(gymId).get();
        const gymData = gymDoc.exists ? gymDoc.data() : null;

        res.status(200).json({
            gymPost: {
                _id: postDoc.id,
                ...postDoc.data(),
                gymId: gymData ? { _id: gymId, GymName: gymData.GymName, Address: gymData.GymAddress } : null
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 15. Get All Gym Posts --- //
exports.getAllGymPosts = async (req, res) => {
    try {
        const gymsSnap = await db.collection('users').where('Role', '==', 'Gym').where('Approve', '==', true).get();
        const approvedGymsMap = {};
        gymsSnap.forEach(doc => {
            approvedGymsMap[doc.id] = doc.data();
        });

        const postsSnap = await db.collection('gymPosts').get();
        const gymPosts = [];
        
        postsSnap.forEach(doc => {
            const data = doc.data();
            if (approvedGymsMap[data.gymId]) {
                const gymData = approvedGymsMap[data.gymId];
                gymPosts.push({
                    _id: doc.id,
                    ...data,
                    gymId: { _id: data.gymId, GymName: gymData.GymName, Address: gymData.GymAddress }
                });
            }
        });

        if (gymPosts.length === 0) {
            return res.status(404).json({ message: 'No gym post found' });
        }

        res.status(200).json({ gymPosts });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};