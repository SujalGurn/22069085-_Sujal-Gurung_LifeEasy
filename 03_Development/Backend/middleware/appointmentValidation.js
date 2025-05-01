import moment from 'moment';

export const validateAppointment = (req, res, next) => {
    const { doctor_id, date, time } = req.body;
    
    // Validate date format
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({
            success: false,
            field: 'date',
            message: "Invalid date format (YYYY-MM-DD required)"
        });
    }

    // Validate time format
    if (!moment(time, 'HH:mm:ss', true).isValid()) {
        return res.status(400).json({
            success: false,
            field: 'time',
            message: "Invalid time format (HH:mm:ss required)"
        });
    }

    // Validate required fields
    if (!doctor_id || !req.user?.id) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    next();
};