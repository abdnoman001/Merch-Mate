import AsyncStorage from '@react-native-async-storage/async-storage';

const TNA_STORAGE_KEY = '@tna_entries';
const SAMPLE_STORAGE_KEY = '@sample_trackers';

// ==================== TNA CRUD ====================

export const saveTNA = async (tna) => {
    try {
        const existing = await getAllTNAs();
        existing.unshift(tna);
        await AsyncStorage.setItem(TNA_STORAGE_KEY, JSON.stringify(existing));
        return tna;
    } catch (error) {
        console.error('Error saving TNA:', error);
        return null;
    }
};

export const getAllTNAs = async () => {
    try {
        const data = await AsyncStorage.getItem(TNA_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading TNAs:', error);
        return [];
    }
};

export const getTNAById = async (id) => {
    try {
        const all = await getAllTNAs();
        return all.find((item) => item.id === id) || null;
    } catch (error) {
        console.error('Error getting TNA:', error);
        return null;
    }
};

export const updateTNA = async (id, updatedData) => {
    try {
        const all = await getAllTNAs();
        const index = all.findIndex((item) => item.id === id);
        if (index === -1) return false;
        all[index] = { ...all[index], ...updatedData, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(TNA_STORAGE_KEY, JSON.stringify(all));
        return true;
    } catch (error) {
        console.error('Error updating TNA:', error);
        return false;
    }
};

export const deleteTNA = async (id) => {
    try {
        const all = await getAllTNAs();
        const filtered = all.filter((item) => item.id !== id);
        await AsyncStorage.setItem(TNA_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting TNA:', error);
        return false;
    }
};

// ==================== Sample Tracker CRUD ====================

export const saveSampleTracker = async (sample) => {
    try {
        const existing = await getAllSampleTrackers();
        existing.unshift(sample);
        await AsyncStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(existing));
        return sample;
    } catch (error) {
        console.error('Error saving sample tracker:', error);
        return null;
    }
};

export const getAllSampleTrackers = async () => {
    try {
        const data = await AsyncStorage.getItem(SAMPLE_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error loading sample trackers:', error);
        return [];
    }
};

export const getSampleTrackerById = async (id) => {
    try {
        const all = await getAllSampleTrackers();
        return all.find((item) => item.id === id) || null;
    } catch (error) {
        console.error('Error getting sample tracker:', error);
        return null;
    }
};

export const updateSampleTracker = async (id, updatedData) => {
    try {
        const all = await getAllSampleTrackers();
        const index = all.findIndex((item) => item.id === id);
        if (index === -1) return false;
        all[index] = { ...all[index], ...updatedData, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(all));
        return true;
    } catch (error) {
        console.error('Error updating sample tracker:', error);
        return false;
    }
};

export const deleteSampleTracker = async (id) => {
    try {
        const all = await getAllSampleTrackers();
        const filtered = all.filter((item) => item.id !== id);
        await AsyncStorage.setItem(SAMPLE_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch (error) {
        console.error('Error deleting sample tracker:', error);
        return false;
    }
};
