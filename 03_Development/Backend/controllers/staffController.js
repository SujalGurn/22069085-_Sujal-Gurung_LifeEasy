import { createStaff, getAllStaff, updateStaff, deleteStaff } from '../models/Staff.js';

const validateStaffData = (data) => {
    const errors = [];

    if (!data.full_name?.trim()) errors.push('Full name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.department?.trim()) errors.push('Department is required');
    if (!['staff', 'nurse'].includes(data.role)) errors.push('Invalid role');
    if (!data.contact_number?.trim()) errors.push('Contact number is required');

    return errors;
};

export const createStaffMember = async (req, res) => {
    try {
        const validationErrors = validateStaffData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const result = await createStaff(req.body);

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json({
            success: true,
            staffId: result.staffId,
            message: result.message
        });

    } catch (error) {
        console.error('Staff creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const getStaffList = async (req, res) => {
    try {
        const result = await getAllStaff();

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json({
            success: true,
            count: result.data.length,
            data: result.data
        });

    } catch (error) {
        console.error('Staff list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve staff list',
            error: error.message
        });
    }
};

export const updateStaffMember = async (req, res) => {
    const { id } = req.params;
    try {
        const validationErrors = validateStaffData(req.body); // Reuse validation
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        const result = await updateStaff(id, req.body);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Staff member with ID ${id} updated successfully` });

    } catch (error) {
        console.error(`Error updating staff member with ID ${id}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const deleteStaffMember = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await deleteStaff(id);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Staff member with ID ${id} deleted successfully` });

    } catch (error) {
        console.error(`Error deleting staff member with ID ${id}:`, error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};