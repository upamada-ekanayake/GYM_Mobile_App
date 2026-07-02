const { db } = require('../config/firebase');

// --- 01. Create a new Coach Post --- //
exports.createCoachPost = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { fullname, description, experience, fee, duration, contactNumber, postimage } = req.body;

        const coachDoc = await db.collection('users').doc(coachId).get();
        if (!coachDoc.exists) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        const coach = coachDoc.data();
        if (!coach.Approve) {
            return res.status(400).json({ message: 'Coach is not approved, So you cant create coach post' });
        }

        if (contactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const existingQuery = await db.collection('coachPosts').where('coachId', '==', coachId).get();
        if (!existingQuery.empty) {
            return res.status(400).json({ message: 'Coach post already exists for this coach' });
        }

        const postData = {
            coachId,
            fullname,
            description,
            experience,
            fee,
            duration,
            contactNumber,
            postimage: postimage || null
        };

        const postRef = await db.collection('coachPosts').add(postData);

        res.status(201).json({
            message: 'Coach post created successfully',
            coachPost: { _id: postRef.id, ...postData }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- Helper to update a field on Coach Post --- //
const updateCoachPostField = async (req, res, fieldName, successMsg, failMsg) => {
    try {
        const { coachPostId } = req.params;
        const value = req.body[fieldName];

        const postRef = db.collection('coachPosts').doc(coachPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        await postRef.update({ [fieldName]: value });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: successMsg,
            [`update_${fieldName}`]: { _id: coachPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Update Description on Coach Post --- //
exports.updateDescription = async (req, res) => {
    await updateCoachPostField(req, res, 'description', 'Description updated successfully');
};

// --- 03. Update Experience on Coach Post --- //
exports.updateExperience = async (req, res) => {
    await updateCoachPostField(req, res, 'experience', 'Experience updated successfully');
};

// --- 04. Update Fee on Coach Post --- //
exports.updateFee = async (req, res) => {
    await updateCoachPostField(req, res, 'fee', 'Fee updated successfully');
};

// --- 05. Update Duration on Coach Post --- //
exports.updateDuration = async (req, res) => {
    await updateCoachPostField(req, res, 'duration', 'Duration updated successfully');
};

// --- 06. Update Contact Number on Coach Post --- //
exports.updateContactNumber = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { contactNumber } = req.body;

        if (!contactNumber || contactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 digits' });
        }

        const postRef = db.collection('coachPosts').doc(coachPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        await postRef.update({ contactNumber });
        const updatedDoc = await postRef.get();

        res.status(200).json({
            message: 'Contact number updated successfully',
            update_contactNumber: { _id: coachPostId, ...updatedDoc.data() }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Update Post Image on Coach Post --- //
exports.updatePostImage = async (req, res) => {
    await updateCoachPostField(req, res, 'postimage', 'Post image updated successfully');
};

// --- 08. Delete Coach Post --- //
exports.deleteCoachPost = async (req, res) => {
    try {
        const { coachPostId } = req.params;

        const postRef = db.collection('coachPosts').doc(coachPostId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        await postRef.delete();

        res.status(200).json({ message: 'Coach post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Coach Post By Coach ID --- //
exports.getCoachPostByCoachId = async (req, res) => {
    try {
        const { coachId } = req.params;

        const postsQuery = await db.collection('coachPosts').where('coachId', '==', coachId).get();
        if (postsQuery.empty) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        const coachpost = postsQuery.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

        res.status(200).json({ coachpost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Get All Coach Posts --- //
exports.getAllCoachPosts = async (req, res) => {
    try {
        // Get all approved coaches
        const coachesSnap = await db.collection('users').where('Role', '==', 'Coach').where('Approve', '==', true).get();
        const approvedCoachIds = coachesSnap.docs.map(doc => doc.id);

        if (approvedCoachIds.length === 0) {
            return res.status(404).json({ message: 'No coach post found' });
        }

        const postsSnap = await db.collection('coachPosts').get();
        const coachposts = [];
        postsSnap.forEach(doc => {
            const data = doc.data();
            if (approvedCoachIds.includes(data.coachId)) {
                coachposts.push({ _id: doc.id, ...data });
            }
        });

        if (coachposts.length === 0) {
            return res.status(404).json({ message: 'No coach post found' });
        }

        res.status(200).json({ coachposts });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};