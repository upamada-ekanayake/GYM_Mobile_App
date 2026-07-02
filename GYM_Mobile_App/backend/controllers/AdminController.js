const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const bcrypt = require('bcryptjs');

// --- 01. Admin Registration --- //

exports.Admin_Registration = async (req, res) => {
    try {
        const { AdminName, AdminAge, AdminNIC, AdminContactNumber, Email, Password, ConfirmPassword, AdminDP } = req.body;

        // Check if Admin NIC is already registered
        let admin = await Admin.findOne({ AdminNIC });
        if (admin) {
            return res.status(400).json({ message: 'Admin NIC already registered' });
        }

        // Check Contact number has 10 degites 
        if (AdminContactNumber.length !== 10) {
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
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if the passwords are same
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ message: 'Passwords are not same' });
        }

        // Password hashing
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(Password, salt);

        // Save new admin 
        const newAdmin = new Admin({ AdminName, AdminAge, AdminNIC, AdminContactNumber, Email, Password: hashedPassword, AdminDP, Role: 'Admin', Approve: false })
        await newAdmin.save();

        res.status(201).json({ message: 'Admin registered successfully', newAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Admin Login --- //

exports.Admin_Login = async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Check if admin is exist or not 
        let admin = await Admin.findOne({ Email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid email' });
        }

        // Check if password is correct
        let isMatch = await bcrypt.compare(Password, admin.Password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Check Admin is Approve or not 
        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved yet' });
        }

        res.status(200).json({ message: 'Login successfully', admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Contact Number --- //

exports.Admin_UpdateContactNumber = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { newContactNumber } = req.body;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check Contact number has 10 degites
        if (newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Update contactnumber 
        let update_admin = await Admin.findByIdAndUpdate(
            adminId,
            { $set: { AdminContactNumber: newContactNumber } },
            { returnDocument: 'after' }
        );

        if (!update_admin) {
            return res.status(404).json({ message: 'Failed to update contact number' });
        }

        res.status(200).json({ message: 'Contact number updated successfully', update_admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Password --- //

exports.Admin_UpdatePassword = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if the old password is correct
        let isMatch = await bcrypt.compare(oldPassword, admin.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid old password' });
        }

        // Check password length 
        if (newPassword.length < 6 || confirmNewPassword.length < 6) {
            return res.status(404).json({ message: 'Entered new passwords must be at least 6 characters long' });
        }

        // Check if the new passwords are same 
        if (newPassword !== confirmNewPassword) {
            return res.status(404).json({ message: 'Entered new passwords are not matching' });
        }

        // Hash new password 
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        let update_password = await Admin.findByIdAndUpdate(
            adminId,
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


// --- 05. Update Admin DP --- //

exports.Admin_UpdateDP = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { AdminDP } = req.body;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Update admin DP
        let update_dp = await Admin.findByIdAndUpdate(
            adminId,
            { $set: { AdminDP } },
            { returnDocument: 'after' }
        );

        if (!update_dp) {
            return res.status(404).json({ message: 'Failed to update admin DP' });
        }

        res.status(200).json({ message: 'Admin DP updated successfully', update_dp });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Get Admin Role --- //

exports.Admin_Role = async (req, res) => {
    try {
        const { Email } = req.body;

        // Check if admin is exist or not
        let admin = await Admin.findOne({ Email });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ role: admin.Role });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Get Admin Details --- //

exports.Admin_Details = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId).select('-Password');
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Delete Admin --- //

exports.Admin_Delete = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { Password } = req.body;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if the password is correct
        let isMatch = await bcrypt.compare(Password, admin.Password);
        if (!isMatch) {
            return res.status(404).json({ message: 'Invalid password' });
        }

        // Delete admin
        let delete_admin = await Admin.findByIdAndDelete(adminId);
        if (!delete_admin) {
            return res.status(404).json({ message: 'Failed to delete admin' });
        }

        res.status(200).json({ message: 'Admin deleted successfully', delete_admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Get Admin Approval Status --- //

exports.Admin_GetAdminApprovalStatus = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Check if admin is exist or not
        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json({ approvalStatus: admin.Approve });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};