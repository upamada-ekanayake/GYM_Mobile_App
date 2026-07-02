const GymPost = require('../models/GymPost');
const Gym = require('../models/Gym');


// --- 01. Create Gym Post --- //

exports.createGymPost = async (req, res) => {
    try {
        const { gymId } = req.params;
        const { gymInfotmation, gymFasilities, openHours, closeHours, gymContactNumber, city, packages, gymImg } = req.body;

        // Check if the Gym ID is registered 
        let gym = await Gym.findById(gymId);
        if (!gym) {
            return res.status(400).json({ message: 'Gym not found' });
        }

        if (!gym.Approve) {
            return res.status(400).json({ message: 'Gym is not approved, So you cant create Gym post' });
        }

        let GymId = await GymPost.findOne({ gymId });
        if (GymId) {
            return res.status(400).json({ message: 'Gym already create Information' });
        };

        let gymPost = new GymPost({ gymId, gymInfotmation, gymFasilities, openHours, closeHours, city, gymContactNumber, packages, gymImg });
        await gymPost.save();

        res.status(201).json({ message: 'Gym Post created successfully', gymPost });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Update Gym Information --- //

exports.updateGymPostInformation = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { gymInfotmation } = req.body;

        // Update gym information in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { gymInfotmation: gymInfotmation } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post Information updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Add Gym Fasilities --- //

exports.addGymFasilities = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { fasility } = req.body;

        // Add fasility to gym info 
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $push: { gymFasilities: { fasility } } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym fasility added successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Delete Gym Fasilities --- //

exports.deleteGymFasilities = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { fasilityId } = req.body;

        // Remove fasility from gym info
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $pull: { gymFasilities: { _id: fasilityId } } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym fasility deleted successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 05. Update Open Hours --- //

exports.updateOpenHours = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { openHours } = req.body;

        // Update open hours in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { openHours: openHours } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post Open Hours updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Update Close Hours --- //

exports.updateCloseHours = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { closeHours } = req.body;

        // Update close hours in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { closeHours: closeHours } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post Close Hours updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 07. Update Gym Contact Number --- //

exports.updateGymPostContactNumber = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { newContactNumber } = req.body;

        // Check contact number has 10 degites 
        if (newContactNumber.length !== 10) {
            return res.status(400).json({ message: 'Contact number must be 10 degites' });
        }

        // Update contact number in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { gymContactNumber: newContactNumber } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post contact Number updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Update City --- //

exports.updateCity = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { city } = req.body;

        // Update city in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { city: city } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post city updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 09. Add Gym Packages --- //

exports.addGymPackage = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { packageName, packagePrice, packageDuration, features } = req.body;

        // Add packages to gym info 
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $push: { packages: { packageName: packageName, packagePrice: packagePrice, packageDuration: packageDuration, features: features } } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym package added successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 10. Delete Gym Packages --- //

exports.deleteGymPackages = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { packageId } = req.body;

        // Remove package from gym info
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $pull: { packages: { _id: packageId } } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(400).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym package deleted successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 11. Update Gym post Image --- //

exports.updateGymPostImage = async (req, res) => {
    try {
        const { gymPostId } = req.params;
        const { gymImg } = req.body;

        if (!gymImg) {
            return res.status(400).json({ message: 'Gym image URL is required' });
        }

        // Update gym image in database
        let gymPost = await GymPost.findByIdAndUpdate(
            gymPostId,
            { $set: { gymImg: gymImg } },
            { returnDocument: 'after' }
        );

        if (!gymPost) {
            return res.status(404).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym image updated successfully', gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 12. Delete Gym Post --- //

exports.deleteGymPost = async (req, res) => {
    try {
        const { gymPostId } = req.params;

        // Delete gym information from database
        let gymPost = await GymPost.findByIdAndDelete(gymPostId);

        if (!gymPost) {
            return res.status(404).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ message: 'Gym post deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }

};


// --- 13. Get Gym Post Details by GymPost ID--- //

exports.getGymPostByGymPostId = async (req, res) => {
    try {
        const { gymPostId } = req.params;

        // Get gym post details from database
        let gymPost = await GymPost.findById(gymPostId);

        if (!gymPost) {
            return res.status(404).json({ message: 'Gym post not found' });
        }

        res.status(200).json({ gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 14. Get Gym Post by Gym ID --- //

exports.getGymPostByGymId = async (req, res) => {
    try {
        const { gymId } = req.params;

        // Get gym post details from database
        let gymPost = await GymPost.findOne({ gymId }).populate('gymId', 'GymName Address');

        if (!gymPost) {
            return res.status(404).json({ message: 'No gym post found' });
        }

        res.status(200).json({ gymPost });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 15. Get All Gym Posts --- //

exports.getAllGymPosts = async (req, res) => {
    try {
        const approvedgyms = await Gym.find({ Approve: true });
        const gymPosts = await GymPost.find({ gymId: { $in: approvedgyms.map(gym => gym._id) } }).populate('gymId', 'GymName Address');

        if (!gymPosts || gymPosts.length === 0) {
            return res.status(404).json({ message: 'No gym post found' });
        }

        res.status(200).json({ gymPosts });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};