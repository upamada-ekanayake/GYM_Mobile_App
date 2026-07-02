const User = require('../models/User');
const Admin = require('../models/Admin');
const Gym = require('../models/Gym');
const Coach = require('../models/Coach');
const bcrypt = require('bcryptjs');

// --- 01. Get all users details --- //

exports.AdminManage_GetAllUsersDetails = async (req, res) => {
    try {
        const users = await User.find().select('-Password');

        if (!users) {
            return res.status(404).json({ message: 'Users not found' });
        }

        res.status(200).json({ message: 'Users found', users });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Get all gyms details ---

exports.AdminManage_GetAllGymsDetails = async (req, res) => {
    try {
        const gyms = await Gym.find().select('-Password');

        if (!gyms) {
            return res.status(404).json({ message: 'Gyms not found' });
        }

        res.status(200).json({ message: 'Gyms found', gyms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 03. Get all coaches details --- //

exports.AdminManage_GetAllCoachesDetails = async (req, res) => {
    try {
        const coaches = await Coach.find().select('-Password');

        if (!coaches) {
            return res.status(404).json({ message: 'Coaches not found' });
        }

        res.status(200).json({ message: 'Coaches found', coaches });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Get all admins details --- //

exports.AdminManage_GetAllAdminsDetails = async (req, res) => {
    try {
        const admins = await Admin.find().select('-Password');

        if (!admins) {
            return res.status(404).json({ message: 'Admins not found' });
        }

        res.status(200).json({ message: 'Admins found', admins });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Change Approve for user --- //

exports.AdminManage_ChangeApproveForUser = async (req, res) => {
    try {
        const { userId, loginAdminId } = req.params;
        const { Approve } = req.body;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.Approve = Approve;
        await user.save();

        res.status(200).json({ message: 'User approve changed', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Change Approve for gym --- //

exports.AdminManage_ChangeApproveForGym = async (req, res) => {
    try {
        const { gymId, loginAdminId } = req.params;
        const { Approve } = req.body;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const gym = await Gym.findById(gymId);

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        gym.Approve = Approve;
        await gym.save();

        res.status(200).json({ message: 'Gym approve changed', gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Change Approve for coach --- //

exports.AdminManage_ChangeApproveForCoach = async (req, res) => {
    try {
        const { coachId, loginAdminId } = req.params;
        const { Approve } = req.body;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const coach = await Coach.findById(coachId);

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        coach.Approve = Approve;
        await coach.save();

        res.status(200).json({ message: 'Coach approve changed', coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Change Approve for admin --- //

exports.AdminManage_ChangeApproveForAdmin = async (req, res) => {
    try {
        const { adminId, loginAdminId } = req.params;
        const { Approve } = req.body;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        admin.Approve = Approve;
        await admin.save();

        res.status(200).json({ message: 'Admin approve changed', admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Sort Up to approve fales users  -- //

exports.AdminManage_SortUpToApproveFalesUsers = async (req, res) => {
    try {
        const users = await User.find();

        if (!users) {
            return res.status(404).json({ message: 'Users not found' });
        }

        users.sort((a, b) => b.Approve - a.Approve);

        res.status(200).json({ message: 'Users sorted', users });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Sort Up to approve fales gyms  -- //

exports.AdminManage_SortUpToApproveFalesGyms = async (req, res) => {
    try {
        const gyms = await Gym.find();

        if (!gyms) {
            return res.status(404).json({ message: 'Gyms not found' });
        }

        gyms.sort((a, b) => b.Approve - a.Approve);

        res.status(200).json({ message: 'Gyms sorted', gyms });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Sort Up to approve fales coaches  -- //

exports.AdminManage_SortUpToApproveFalesCoaches = async (req, res) => {
    try {
        const coaches = await Coach.find();

        if (!coaches) {
            return res.status(404).json({ message: 'Coaches not found' });
        }

        coaches.sort((a, b) => b.Approve - a.Approve);

        res.status(200).json({ message: 'Coaches sorted', coaches });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 12. Sort Up to approve fales admins  -- //

exports.AdminManage_SortUpToApproveFalesAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();

        if (!admins) {
            return res.status(404).json({ message: 'Admins not found' });
        }

        admins.sort((a, b) => b.Approve - a.Approve);

        res.status(200).json({ message: 'Admins sorted', admins });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 13. Delete User  -- //

exports.AdminManage_DeleteUser = async (req, res) => {
    try {
        const { userId, loginAdminId } = req.params;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        res.status(200).json({ message: 'User deleted', user });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 14. Delete Gym  -- //

exports.AdminManage_DeleteGym = async (req, res) => {
    try {
        const { gymId, loginAdminId } = req.params;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const gym = await Gym.findById(gymId);

        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        await gym.deleteOne();

        res.status(200).json({ message: 'Gym deleted', gym });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 15. Delete Coach  -- //

exports.AdminManage_DeleteCoach = async (req, res) => {
    try {
        const { coachId, loginAdminId } = req.params;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const coach = await Coach.findById(coachId);

        if (!coach) {
            return res.status(404).json({ message: 'Coach not found' });
        }

        await coach.deleteOne();

        res.status(200).json({ message: 'Coach deleted', coach });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 16. Delete Admin  -- //

exports.AdminManage_DeleteAdmin = async (req, res) => {
    try {
        const { adminId, loginAdminId } = req.params;

        const loginAdmin = await Admin.findById(loginAdminId);
        if (!loginAdmin || loginAdmin.Approve !== true) {
            return res.status(403).json({ message: 'You need access' });
        }

        const admin = await Admin.findById(adminId);

        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await admin.deleteOne();

        res.status(200).json({ message: 'Admin deleted', admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};  