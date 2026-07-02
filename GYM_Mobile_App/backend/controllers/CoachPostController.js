const Coachpost = require('../models/CoachPost');
const Coach = require('../models/Coach');

// --- 01. Create a new Coach Post --- //

exports.createCoachPost = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { fullname, description, experience, fee, duration, contactNumber, postimage } = req.body;

        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        if (!coach.Approve) {
            return res.status(400).json({ message: 'Coach is not approved, So you cant create coach post' });
        }

        if (contactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        const existingCoachPost = await Coachpost.findOne({ coachId });
        if (existingCoachPost) {
            return res.status(400).json({ message: 'Coach post already exists for this coach' });
        };

        const newCoachPost = new Coachpost({ coachId, fullname, description, experience, fee, duration, contactNumber, postimage });
        await newCoachPost.save();

        res.status(201).json({ message: 'Coach post created successfully', coachPost: newCoachPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Update Description on Coach Post--- //

exports.updateDescription = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { description } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update description
        let update_description = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { description: description } },
            { returnDocument: 'after' }
        );

        if (!update_description) {
            return res.status(404).json({ message: 'Failed to update description' });
        }

        res.status(200).json({ message: 'Description updated successfully', update_description });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Experience on Coach Post--- //

exports.updateExperience = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { experience } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update experience
        let update_experience = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { experience: experience } },
            { returnDocument: 'after' }
        );

        if (!update_experience) {
            return res.status(404).json({ message: 'Failed to update experience' });
        }

        res.status(200).json({ message: 'Experience updated successfully', update_experience });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Fee on Coach Post--- //

exports.updateFee = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { fee } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update fee
        let update_fee = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { fee: fee } },
            { returnDocument: 'after' }
        );

        if (!update_fee) {
            return res.status(404).json({ message: 'Failed to update fee' });
        }

        res.status(200).json({ message: 'Fee updated successfully', update_fee });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 05. Update Duration on Coach Post--- //

exports.updateDuration = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { duration } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update duration
        let update_duration = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { duration: duration } },
            { returnDocument: 'after' }
        );

        if (!update_duration) {
            return res.status(404).json({ message: 'Failed to update duration' });
        }

        res.status(200).json({ message: 'Duration updated successfully', update_duration });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Update Contact Number on Coach Post--- //

exports.updateContactNumber = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { contactNumber } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update contactnumber
        let update_contactNumber = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { contactNumber: contactNumber } },
            { returnDocument: 'after' }
        );

        if (!update_contactNumber) {
            return res.status(404).json({ message: 'Failed to update contactnumber' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', update_contactNumber });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Update Post Image on Coach Post--- //

exports.updatePostImage = async (req, res) => {
    try {
        const { coachPostId } = req.params;
        const { postimage } = req.body;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Update postimage
        let update_postimage = await Coachpost.findByIdAndUpdate(
            coachPostId,
            { $set: { postimage: postimage } },
            { returnDocument: 'after' }
        );

        if (!update_postimage) {
            return res.status(404).json({ message: 'Failed to update postimage' });
        }

        res.status(200).json({ message: 'Post image updated successfully', update_postimage });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Delete Coach Post--- //

exports.deleteCoachPost = async (req, res) => {
    try {
        const { coachPostId } = req.params;

        // Check if coach is exist or not
        let coachpost = await Coachpost.findById(coachPostId);
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        // Delete coachpost
        await Coachpost.findByIdAndDelete(coachPostId);

        res.status(200).json({ message: 'Coach post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Get Coach Post By Coach ID--- //

exports.getCoachPostByCoachId = async (req, res) => {
    try {
        const { coachId } = req.params;

        // Find coachpost by coachId
        let coachpost = await Coachpost.find({ coachId: coachId });
        if (!coachpost) {
            return res.status(404).json({ message: 'Coach post not found' });
        }

        res.status(200).json({ coachpost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 10. Get All Coach Posts --- //

exports.getAllCoachPosts = async (req, res) => {
    try {
        // Get all coachposts
        const approvedcoachs = await Coach.find({ Approve: true });
        const coachposts = await Coachpost.find({ coachId: { $in: approvedcoachs.map(coach => coach._id) } });

        if (!coachposts || coachposts.length === 0) {
            return res.status(404).json({ message: 'No coach post found' });
        }

        res.status(200).json({ coachposts });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};