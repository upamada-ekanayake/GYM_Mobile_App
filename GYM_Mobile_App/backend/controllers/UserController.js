const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 01. User Registration --- //

exports.User_Registration = async (req, res) => {
    try {
        const { UserName, UserAge, UserNIC, UserContactNumber, Email, Password, ConfirmPassword, UserDP } = req.body;

        // Check if User NIC is already registered
        let user = await User.findOne({ UserNIC });
        if (user) {
            return res.status(400).json({ message: 'User NIC already registered' });
        };

        // Check Contact number has 10 degites 
        if (UserContactNumber.length !== 10) {
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
        const newUser = new User({ UserName, UserAge, UserNIC, UserContactNumber, Email, Password: hashedPassword, UserDP, Role: 'User', Approve: true })
        await newUser.save();

        const userObj = newUser.toObject();
        delete userObj.Password;

        res.status(201).json({ message: 'User registered successfully', newUser: userObj });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. User Login --- //

exports.User_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if user is exist or not 
        let user = await User.findOne({ Email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Check if password is correct
        let isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.Role, email: user.Email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        const userObj = user.toObject();
        delete userObj.Password;

        res.status(200).json({ message: 'Login successfully', user: userObj, token });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Contact Number --- //

exports.User_UpdateContactNumber = async (req, res) => {
    try {
        const { userId } = req.params;
        const { newContactNumber } = req.body;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check Contact number has 10 degites
        if (newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Update contactnumber 
        let update_user = await User.findByIdAndUpdate(
            userId,
            { $set: { UserContactNumber: newContactNumber } },
            { returnDocument: 'after' }
        );

        if (!update_user) {
            return res.status(404).json({ message: 'Failed to update contact number' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', update_user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Password --- //

exports.User_UpdatePassword = async (req, res) => {
    try {
        const { userId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the old password is correct
        let isMatch = await bcrypt.compare(oldPassword, user.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid old password' });
        }

        // Check password length 
        if (newPassword.length < 6 || confirmNewPassword.length < 6) {
            return res.status(404).json({ message: 'Entered new password must be at least 6 characters long' });
        }

        // Check if the new passwords are same 
        if (newPassword !== confirmNewPassword) {
            return res.status(404).json({ message: 'New passwords are not same' });
        }

        // Hash new password 
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        let update_password = await User.findByIdAndUpdate(
            userId,
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


// --- 05. Update User DP --- //

exports.User_UpdateDP = async (req, res) => {
    try {
        const { userId } = req.params;
        const { UserDP } = req.body;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update Image
        let update_dp = await User.findByIdAndUpdate(
            userId,
            { $set: { UserDP: UserDP } },
            { returnDocument: 'after' }
        );

        if (!update_dp) {
            return res.status(404).json({ message: 'Failed to update User DP' });
        }

        res.status(200).json({ message: 'User DP updated successfully', update_dp });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Get User Role --- //

exports.User_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        // Check if user is exist or not
        let user = await User.findOne({ Email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ role: user.Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Get User Details --- //

exports.User_Details = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is exist or not
        let user = await User.findById(userId).select('-Password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Delete User --- //

exports.User_Detele = async (req, res) => {
    try {
        const { userId } = req.params;
        const { password } = req.body;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is correct
        let isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid password' });
        }

        // Delete user
        let delete_user = await User.findByIdAndDelete(userId);
        if (!delete_user) {
            return res.status(404).json({ message: 'Failed to delete user' });
        }

        res.status(200).json({ message: 'User deleted successfully', delete_user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Get User Approval Status --- //

exports.User_GetUserApprovalStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ approvalStatus: user.Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};