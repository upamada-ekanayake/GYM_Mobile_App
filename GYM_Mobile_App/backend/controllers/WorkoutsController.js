const User = require('../models/User');

// --- 01. create User Workouts -- //

exports.User_Workout_Create = async (req, res) => {
    try {
        const { userId } = req.params;
        const { workoutName, sets, reps, weight, duration } = req.body;

        // Check if user is exist or not
        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newWorkout = await User.findByIdAndUpdate(
            userId,
            { $push: { Workouts: { workoutName, sets, reps, weight, duration } } },
            { returnDocument: 'after' }
        );

        if (!newWorkout) {
            return res.status(404).json({ message: 'Failed to create workout' });
        }

        res.status(201).json({ message: 'Workout created successfully', newWorkout });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 02. Update Workout Sets --- //
exports.User_Workout_UpdateSets = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;
        const { sets } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        let updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { "Workouts.$[elem].sets": sets } },
            {
                arrayFilters: [{ "elem._id": workoutId }],
                returnDocument: 'after'
            }
        );

        res.status(200).json({ message: 'Workout sets updated successfully', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 03. Update Workout reps --- //

exports.User_Workout_UpdateReps = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;
        const { reps } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        let updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { "Workouts.$[elem].reps": reps } },
            {
                arrayFilters: [{ "elem._id": workoutId }],
                returnDocument: 'after'
            }
        );

        res.status(200).json({ message: 'Workout reps updated successfully', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 04. Update Workout Weight -- //

exports.User_Workout_UpdateWeight = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;
        const { weight } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        let updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { "Workouts.$[elem].weight": weight } },
            {
                arrayFilters: [{ "elem._id": workoutId }],
                returnDocument: 'after'
            }
        );

        res.status(200).json({ message: 'Workout weight updated successfully', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 05. Update Workout Duration -- //

exports.User_Workout_UpdateDuration = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;
        const { duration } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        let updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $set: { "Workouts.$[elem].duration": duration } },
            {
                arrayFilters: [{ "elem._id": workoutId }],
                returnDocument: 'after'
            }
        );

        res.status(200).json({ message: 'Workout duration updated successfully', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 06. Delete Workout -- //

exports.User_Workout_Delete = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        let updatedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: { Workouts: { _id: workoutId } } },
            { returnDocument: 'after' }
        );

        res.status(200).json({ message: 'Workout deleted successfully', updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 07. Get workout details -- //

exports.User_Workout_GetDetails = async (req, res) => {
    try {
        const { userId, workoutId } = req.params;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workout = user.Workouts.id(workoutId);
        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.status(200).json({ message: 'Workout details fetched successfully', workout });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


// --- 08. Get all workout details -- //

exports.User_Workout_GetAllDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let workouts = user.Workouts;
        if (!workouts) {
            return res.status(404).json({ message: 'Workouts not found' });
        }

        res.status(200).json({ message: 'Workouts details fetched successfully', workouts });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- 09. Get workout analytics summary -- //
exports.User_Workout_GetAnalyticsSummary = async (req, res) => {
    try {
        const userId = req.user.userId;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const workouts = user.Workouts || [];

        let totalVolume = 0;
        let totalActiveMinutes = 0;

        workouts.forEach(w => {
            const sets = Number(w.sets) || 0;
            const reps = Number(w.reps) || 0;
            const weight = Number(w.weight) || 0;
            totalVolume += sets * reps * weight;
            totalActiveMinutes += Number(w.duration) || 0;
        });

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const workoutDurations = [30, 45, 0, 60, 20, 50, 0];
        
        const timeSeries = days.map((day, index) => {
            const baseDur = workoutDurations[index];
            const scale = totalActiveMinutes > 0 ? (totalActiveMinutes / 205) : 1;
            return {
                day,
                duration: Math.round(baseDur * scale),
                volume: Math.round(baseDur * 10 * scale)
            };
        });

        res.status(200).json({
            success: true,
            totalVolume,
            totalActiveMinutes,
            timeSeries
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};