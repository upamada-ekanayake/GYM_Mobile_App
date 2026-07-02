const supplement = require('../models/SupplementPost');
const Admin = require('../models/Admin');

// --- 01. Create a new supplement Post --- //

exports.Supplement_Create = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { SupplementName, SupplementBrand, SupplementType, SupplementDescription, SupplementPrice, SupplementStock, SupplementImage } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        if (SupplementPrice <= 0) {
            return res.status(400).json({ message: 'Supplement price must be greater than 0' });
        }

        if (SupplementStock < 0) {
            return res.status(400).json({ message: 'Supplement stock must be greater than 0' });
        }

        let SupplementAvailable
        if (SupplementStock == 0) {
            SupplementAvailable = false;
        } else {
            SupplementAvailable = true;
        }

        const newSupplement = new supplement({ SupplementName, SupplementBrand, SupplementType, SupplementDescription, SupplementPrice, SupplementStock, SupplementAvailable: SupplementAvailable, SupplementImage });
        await newSupplement.save();

        res.status(201).json({ message: 'Supplement created successfully', supplement: newSupplement });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 02. Update Supplement Name --- //

exports.Supplement_Update_Name = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementName } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement name
        let update_supplementName = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementName: SupplementName } },
            { returnDocument: 'after' }
        );

        if (!update_supplementName) {
            return res.status(404).json({ message: 'Failed to update supplement name' });
        }

        res.status(200).json({ message: 'Supplement name updated successfully', update_supplementName });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Supplement Brand --- //

exports.Supplement_Update_Brand = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementBrand } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement brand
        let update_supplementBrand = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementBrand: SupplementBrand } },
            { returnDocument: 'after' }
        );

        if (!update_supplementBrand) {
            return res.status(404).json({ message: 'Failed to update supplement brand' });
        }

        res.status(200).json({ message: 'Supplement brand updated successfully', update_supplementBrand });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 04. Update Supplement Type --- //

exports.Supplement_Update_Type = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementType } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement type
        let update_supplementType = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementType: SupplementType } },
            { returnDocument: 'after' }
        );

        if (!update_supplementType) {
            return res.status(404).json({ message: 'Failed to update supplement type' });
        }

        res.status(200).json({ message: 'Supplement type updated successfully', update_supplementType });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 05. Update Supplement Description --- //

exports.Supplement_Update_Description = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementDescription } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement description
        let update_supplementDescription = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementDescription: SupplementDescription } },
            { returnDocument: 'after' }
        );

        if (!update_supplementDescription) {
            return res.status(404).json({ message: 'Failed to update supplement description' });
        }

        res.status(200).json({ message: 'Supplement description updated successfully', update_supplementDescription });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 06. Update Supplement Price --- //

exports.Supplement_Update_Price = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementPrice } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement price
        let update_supplementPrice = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementPrice: SupplementPrice } },
            { returnDocument: 'after' }
        );

        if (!update_supplementPrice) {
            return res.status(404).json({ message: 'Failed to update supplement price' });
        }

        res.status(200).json({ message: 'Supplement price updated successfully', update_supplementPrice });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Update Supplement Stock --- //

exports.Supplement_Update_Stock = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementStock } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        if (SupplementStock < 0) {
            return res.status(400).json({ message: 'Supplement stock must be greater than 0' });
        }

        let SupplementAvailable
        if (SupplementStock == 0) {
            SupplementAvailable = false;
        } else {
            SupplementAvailable = true;
        }

        // Update supplement stock
        let update_supplementStock = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementStock: SupplementStock } },
            { returnDocument: 'after' }
        );

        if (!update_supplementStock) {
            return res.status(404).json({ message: 'Failed to update supplement stock' });
        }

        // Update supplement available
        let update_supplementAvailable = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementAvailable: SupplementAvailable } },
            { returnDocument: 'after' }
        );

        if (!update_supplementAvailable) {
            return res.status(404).json({ message: 'Failed to update supplement available' });
        }

        res.status(200).json({ message: 'Supplement stock updated successfully', update_supplementAvailable });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 08. Update Supplement Image --- //

exports.Supplement_Update_Image = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;
        const { SupplementImage } = req.body;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Update supplement image
        let update_supplementImage = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementImage: SupplementImage } },
            { returnDocument: 'after' }
        );

        if (!update_supplementImage) {
            return res.status(404).json({ message: 'Failed to update supplement image' });
        }

        res.status(200).json({ message: 'Supplement image updated successfully', update_supplementImage });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get Supplement Details By Supplement post Id -- //

exports.Supplement_Get_Details_By_Supplement_Id = async (req, res) => {
    try {
        const { supplementPostId } = req.params;

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        res.status(200).json({ message: 'Supplement post details found successfully', Supplement });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 10. Get All Supplement Posts -- //

exports.Supplement_Get_All = async (req, res) => {
    try {
        let Supplement = await supplement.find();

        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement posts not found' });
        }

        res.status(200).json({ message: 'Supplement posts details found successfully', Supplement });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 11. Delete Supplement Post --- //

exports.Supplement_Delete = async (req, res) => {
    try {
        const { supplementPostId, adminId } = req.params;

        let admin = await Admin.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (!admin.Approve) {
            return res.status(400).json({ message: 'Admin is not approved' });
        }

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement post not found' });
        }

        // Delete supplement
        let delete_supplement = await supplement.findByIdAndDelete(supplementPostId);

        if (!delete_supplement) {
            return res.status(404).json({ message: 'Failed to delete supplement' });
        }

        res.status(200).json({ message: 'Supplement deleted successfully', delete_supplement });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 12. Get Supplement Price By Supplement Id -- //

exports.Supplement_Price_By_Supplement_Id = async (req, res) => {
    try {
        const { supplementPostId } = req.params;

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement not found' });
        }

        res.status(200).json({ message: 'Supplement price by supplement id found successfully', SupplementPrice: Supplement.SupplementPrice });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 13. Buy Supplement -- //

exports.Supplement_Buy = async (req, res) => {
    try {
        const { supplementPostId } = req.params;
        const { CradNumber, ExpiryDate, CVV, Amount, Quantity } = req.body;

        // Check if supplement is exist or not
        let Supplement = await supplement.findById(supplementPostId);
        if (!Supplement) {
            return res.status(404).json({ message: 'Supplement not found' });
        }

        // Check supplement available
        if (!Supplement.SupplementAvailable) {
            return res.status(404).json({ message: 'Supplement not available' });
        }

        // Check supplement stock
        if (Supplement.SupplementStock == 0) {
            return res.status(404).json({ message: 'Supplement stock is 0' });
        }

        // Check Card Details
        if (CradNumber !== 1234123412341234) {
            return res.status(404).json({ message: 'Invalid Card Number' });
        }

        if (ExpiryDate !== "12/26") {
            return res.status(404).json({ message: 'Invalid Expiry Date' });
        }

        if (CVV !== 123) {
            return res.status(404).json({ message: 'Invalid CVV' });
        }

        if (Amount !== Supplement.SupplementPrice * Quantity) {
            return res.status(404).json({ message: 'Invalid Amount' });
        }

        // Update supplement stock
        let update_supplementStock = await supplement.findByIdAndUpdate(
            supplementPostId,
            { $set: { SupplementStock: Supplement.SupplementStock - Quantity } },
            { returnDocument: 'after' }
        );

        if (!update_supplementStock) {
            return res.status(404).json({ message: 'Failed to update supplement stock' });
        }

        // Update supplement available
        if (Supplement.SupplementStock == 0) {
            let update_supplementAvailable = await supplement.findByIdAndUpdate(
                supplementPostId,
                { $set: { SupplementAvailable: false } },
                { returnDocument: 'after' }
            );

            if (!update_supplementAvailable) {
                return res.status(404).json({ message: 'Failed to update supplement available' });
            }
        }

        let updated_supplement = await supplement.findById(supplementPostId);

        res.status(200).json({ message: 'Supplement bought successfully', updated_supplement });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

