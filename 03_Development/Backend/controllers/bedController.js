import { createBed, updateBed, deleteBed, assignBedToPatient, dischargePatientFromBed, getAllBeds, getBedById } from '../models/Bed.js';

export const BedController = {
    addBed: async (req, res) => {
        try {
            const bedData = {
                bed_number: req.body.bed_number,
                room_number: req.body.room_number,
                room_type: req.body.room_type,
                status: req.body.status || 'available',
                notes: req.body.notes,
                assigned_by: req.user.id,
            };
            const result = await createBed(bedData);
            if (result.success) {
                res.status(201).json({ success: true, id: result.id });
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            console.error('Error in addBed:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    updateBed: async (req, res) => {
        try {
            const bedData = {
                bed_number: req.body.bed_number,
                room_number: req.body.room_number,
                room_type: req.body.room_type,
                status: req.body.status,
                notes: req.body.notes,
                last_updated_by: req.user.id,
            };
            const result = await updateBed(req.params.id, bedData);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error in updateBed:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    deleteBed: async (req, res) => {
        try {
            const result = await deleteBed(req.params.id);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error in deleteBed:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    assignBed: async (req, res) => {
        try {
            const { patient_id, admission_date } = req.body;
            console.log('Assign bed request:', { bedId: req.params.id, patient_id, admission_date, userId: req.user.id });

            // Validate request body
            if (!patient_id || !admission_date) {
                return res.status(400).json({ success: false, message: 'patient_id and admission_date are required' });
            }

            const result = await assignBedToPatient(req.params.id, patient_id, admission_date, req.user.id);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error in assignBed:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    dischargePatient: async (req, res) => {
        try {
            const { discharge_date } = req.body;
            const result = await dischargePatientFromBed(req.params.id, discharge_date || new Date(), req.user.id);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error in dischargePatient:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    getBeds: async (req, res) => {
        try {
            const filters = {
                status: req.query.status,
                room_type: req.query.room_type,
                room_number: req.query.room_number,
            };
            const result = await getAllBeds(filters);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Error in getBeds:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    },

    getBed: async (req, res) => {
        try {
            const result = await getBedById(req.params.id);
            res.status(result.success ? 200 : 404).json(result);
        } catch (error) {
            console.error('Error in getBed:', error);
            res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
        }
    }
};