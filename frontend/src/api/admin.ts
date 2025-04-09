import axios from 'axios';
import { Admin, AdminCreate, AdminUpdate } from '../types/admin';

const BASE_URL = 'http://localhost:8000/admin';

// Get all administrators with pagination
export const getAdmins = async (skip = 0, limit = 100): Promise<Admin[]> => {
  try {
    const response = await axios.get(`${BASE_URL}/?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching administrators:', error);
    throw error;
  }
};

// Get an administrator by stuff_id
export const getAdmin = async (stuffId: string): Promise<Admin> => {
  try {
    const response = await axios.get(`${BASE_URL}/${stuffId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching administrator with ID ${stuffId}:`, error);
    throw error;
  }
};

// Create a new administrator
export const createAdmin = async (admin: AdminCreate): Promise<Admin> => {
  try {
    const response = await axios.post(BASE_URL, admin);
    return response.data;
  } catch (error) {
    console.error('Error creating administrator:', error);
    throw error;
  }
};

// Update an administrator
export const updateAdmin = async (stuffId: string, admin: AdminUpdate): Promise<Admin> => {
  try {
    const response = await axios.put(`${BASE_URL}/${stuffId}`, admin);
    return response.data;
  } catch (error) {
    console.error(`Error updating administrator with ID ${stuffId}:`, error);
    throw error;
  }
};

// Delete an administrator
export const deleteAdmin = async (stuffId: string): Promise<boolean> => {
  try {
    await axios.delete(`${BASE_URL}/${stuffId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting administrator with ID ${stuffId}:`, error);
    throw error;
  }
}; 