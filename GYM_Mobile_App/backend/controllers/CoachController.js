const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const Coachpost = require('../models/CoachPost');
const bcrypt = require('bcryptjs');

// --- 01. Coach Registration --- //

exports.Coach_Registration = async (req, res) => {
    try {
        const { CoachName, CoachAge, CoachNIC, CoachID, CoachContactNumber, Email, Password, ConfirmPassword, CoachDP } = req.body;

        // Check if Coach NIC is already registered
        let coach = await Coach.findOne({ CoachNIC });
        if (coach) {
            return res.status(400).json({ message: 'Coach NIC already registered' });
        }

        // Check if Coach ID is already registered
        let coachid = await Coach.findOne({ CoachID });
        if (coachid) {
            return res.status(400).json({ message: 'Coach ID already registered' });
        }

        // Check Contact number has 10 degites 
        if (CoachContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Check if the email is already registered 
        let useremail = await User.findOne({ Email });
        let adminemail = await Admin.findOne({ Email });
        let gymemail = await Gym.findOne({ Email });
        let coachemail = await Coach.findOne({ Email });

        if (useremail || adminemail || gymemail || coachemail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check password length
        if (Password.length < 6 || ConfirmPassword.length < 6) {
            return res.status(400).json({ message: 'Entered password must be at least 6 characters long' });
        }

        // Check if the passwords are same
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Password hashing
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(Password, salt);

        // Save new coach 
        const newCoach = new Coach({ CoachName, CoachAge, CoachNIC, CoachID, CoachContactNumber, Email, Password: hashedPassword, CoachDP, Role: 'Coach', Approve: false })
        await newCoach.save();

        res.status(201).json({ message: 'Coach registered successfully', newCoach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Coach Login --- //

exports.Coach_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if coach is exist or not 
        let coach = await Coach.findOne({ Email });
        if (!coach) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Check if password is correct
        let isMatch = await bcrypt.compare(Password, coach.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        res.status(200).json({ message: 'Login successfully', coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Contact Number --- //

exports.Coach_UpdateContactNumber = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { newContactNumber } = req.body;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Check Contact number has 10 degites
        if (newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Update contactnumber 
        let update_coach = await Coach.findByIdAndUpdate(
            coachId,
            { $set: { CoachContactNumber: newContactNumber } },
            { returnDocument: 'after' }
        );

        if (!update_coach) {
            return res.status(404).json({ message: 'Failed to update contact number' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', update_coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Password --- //

exports.Coach_UpdatePassword = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { oldPassword, newPassword, ConfirmNewPassword } = req.body;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Check if the old password is correct
        let isMatch = await bcrypt.compare(oldPassword, coach.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid old password' });
        }

        // Check password length 
        if (newPassword.length < 6 || ConfirmNewPassword.length < 6) {
            return res.status(404).json({ message: 'Entered new passwords must be at least 6 characters long' });
        }

        // Check if the new passwords are same 
        if (newPassword !== ConfirmNewPassword) {
            return res.status(404).json({ message: 'New passwords are not same' });
        }

        // Hash new password 
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        let update_password = await Coach.findByIdAndUpdate(
            coachId,
            { $set: { Password: hashedPassword } },
            { returnDocument: 'after' }
        );

        if (!update_password) {
            return res.status(404).json({ message: 'Failed to update password' });
        }

        res.status(200).json({ message: 'Password updated successfully', update_password });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 05. Update Coach DP --- //

exports.Coach_UpdateDP = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { CoachDP } = req.body;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Update coach DP
        let update_dp = await Coach.findByIdAndUpdate(
            coachId,
            { $set: { CoachDP: CoachDP } },
            { returnDocument: 'after' }
        );

        if (!update_dp) {
            return res.status(404).json({ message: 'Failed to update coach DP' });
        }

        res.status(200).json({ message: 'Coach DP updated successfully', update_dp });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Get Coach Role --- //

exports.Coach_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        // Check if coach is exist or not
        let coach = await Coach.findOne({ Email });
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ role: coach.Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Get Coach Details -- // 

exports.Coach_Details = async (req, res) => {
    try {
        const { coachId } = req.params;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId).select('-Password');
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Delete Coach -- //

exports.Coach_Delete = async (req, res) => {
    try {
        const { coachId } = req.params;
        const { Password } = req.body;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        // Verify password
        let isMatch = await bcrypt.compare(Password, coach.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid password' });
        }

        // delete coach post if have function
        let deleteCoachPost = await Coachpost.findOne({ coachId: coachId });

        if (deleteCoachPost) {
            await Coachpost.findByIdAndDelete(deleteCoachPost._id);
        }

        // Delete coach
        let delete_coach = await Coach.findByIdAndDelete(coachId);
        if (!delete_coach) {
            return res.status(404).json({ message: 'Failed to delete coach' });
        }

        res.status(200).json({ message: 'Coach deleted successfully', delete_coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Coach Approval Status --- //

exports.Coach_GetCoachApprovalStatus = async (req, res) => {
    try {
        const { coachId } = req.params;

        // Check if coach is exist or not
        let coach = await Coach.findById(coachId);
        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        res.status(200).json({ approvalStatus: coach.Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};