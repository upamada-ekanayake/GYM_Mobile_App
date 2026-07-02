const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const Gympost = require('../models/GymPost');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 01. Gym Registration ---

exports.Gym_Registration = async (req, res) => {
    try {
        const { GymName, GymOwnerName, GymOwnerNIC, GymID, GymAddress, GymOwnerContactNumber, GymType, Email, Password, ConfirmPassword, GymLogo } = req.body;

        // Ckeck If Gym Name is already registered 
        let gymname = await Gym.findOne({ GymName });
        if (gymname) {
            return res.status(400).json({ message: 'Gym name already registered' });
        }

        // Ckeck If Gym Owner NIC is already registered 
        let gymownerNIC = await Gym.findOne({ GymOwnerNIC });
        if (gymownerNIC) {
            return res.status(400).json({ message: 'Gym Owner NIC already registered' });
        }

        // Check if GymID is already registered
        let gym = await Gym.findOne({ GymID });
        if (gym) {
            return res.status(400).json({ message: 'Gym ID already registered' });
        }

        // Check Contact number has 10 degites 
        if (GymOwnerContactNumber.length !== 10) {
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

        // Save new user 
        const newGym = new Gym({ GymName, GymOwnerName, GymOwnerNIC, GymID, GymAddress, GymOwnerContactNumber, GymType, Email, Password: hashedPassword, GymLogo, Role: 'Gym', Approve: false })
        await newGym.save();

        const gymObj = newGym.toObject();
        delete gymObj.Password;

        res.status(201).json({ message: 'Gym registered successfully', newGym: gymObj });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Gym Login --- //

exports.Gym_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if gym is exist or not 
        let gym = await Gym.findOne({ Email });
        if (!gym) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Check if password is correct
        let isMatch = await bcrypt.compare(Password, gym.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: gym._id, role: gym.Role, email: gym.Email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        const gymObj = gym.toObject();
        delete gymObj.Password;

        res.status(200).json({ message: 'Login successfully', gym: gymObj, token });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Contact Number --- //

exports.Gym_UpdateContactNumber = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { newContactNumber } = req.body;

        // Check if gym is exist or not 
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Check Contact number has 10 degites 
        if (newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Update contactnumber 
        let update_gym = await Gym.findByIdAndUpdate(
            gymId,
            { $set: { GymOwnerContactNumber: newContactNumber } },
            { returnDocument: 'after' }
        );

        if (!update_gym) {
            return res.status(404).json({ message: 'Failed to update contact number' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', update_gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Password --- //

exports.Gym_UpdatePassword = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Check if gym is exist or not 
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Check if old password is correct
        let isMatch = await bcrypt.compare(oldPassword, gym.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid old password' });
        }

        // Check if new password and confirm password are same
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: 'New password and confirm password are not same' });
        }

        // Check password length
        if (newPassword.length < 6 || confirmNewPassword.length < 6) {
            return res.status(400).json({ message: 'Entered new passwords must be at least 6 characters long' });
        }

        // Password hashing
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        let update_password = await Gym.findByIdAndUpdate(
            gymId,
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


// --- 05. Update Gym Logo --- //

exports.Gym_UpdateLogo = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { gymLogo } = req.body;

        // Check if gym is exist or not 
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Update gym logo
        let update_logo = await Gym.findByIdAndUpdate(
            gymId,
            { $set: { GymLogo: gymLogo } },
            { returnDocument: 'after' }
        );

        if (!update_logo) {
            return res.status(404).json({ message: 'Failed to update gym logo' });
        }

        res.status(200).json({ message: 'Gym logo updated successfully', update_logo });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Get Gym Role --- //

exports.Gym_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        // Check if gym is exist or not
        let gym = await Gym.findOne({ Email });
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ role: gym.Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Get Gym Details --- //

exports.Gym_Details = async (req, res) => {
    try {
        const { gymId } = req.params;

        // Check if gym is exist or not 
        let gym = await Gym.findById(gymId).select('-Password');
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Delete Gym --- //

exports.Gym_Delete = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { password } = req.body;

        // Check if gym is exist or not 
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        // Check password
        let isMatch = await bcrypt.compare(password, gym.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Delete Gym post if have
        let deleteGymPost = await Gympost.findOne({ gymId: gymId });

        if (deleteGymPost) {
            await Gympost.findByIdAndDelete(deleteGymPost._id);
        }

        // Delete gym
        let delete_gym = await Gym.findByIdAndDelete(gymId);
        if (!delete_gym) {
            return res.status(404).json({ message: 'Failed to delete gym' });
        }

        res.status(200).json({ message: 'Gym deleted successfully', delete_gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Get Gym Approval Status --- //

exports.Gym_GetGymApprovalStatus = async (req, res) => {
    try {
        const { gymId } = req.params;

        // Check if gym is exist or not
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        res.status(200).json({ approvalStatus: gym.Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
