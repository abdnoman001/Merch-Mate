import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('darkMode');
            if (savedTheme !== null) {
                setIsDarkMode(JSON.parse(savedTheme));
            }
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newValue = !isDarkMode;
            setIsDarkMode(newValue);
            await AsyncStorage.setItem('darkMode', JSON.stringify(newValue));
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const colors = isDarkMode ? {
        // Dark theme colors
        background: '#1a1a2e',
        surface: '#16213e',
        card: '#0f3460',
        text: '#e8e8e8',
        textSecondary: '#a8a8a8',
        border: '#2a2a3e',
        primary: '#007bff',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        icon: '#e8e8e8',
        modalOverlay: 'rgba(0,0,0,0.7)',
        shadow: '#000',
    } : {
        // Light theme colors
        background: '#f0f2f5',
        surface: '#ffffff',
        card: '#ffffff',
        text: '#1a1a2e',
        textSecondary: '#666',
        border: '#e0e0e0',
        primary: '#007bff',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        icon: '#333',
        modalOverlay: 'rgba(0,0,0,0.3)',
        shadow: '#000',
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};
