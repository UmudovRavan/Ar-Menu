import { createContext, useContext, useState } from 'react';
import { menuItems as initialMenuItems } from '../data/menuMock';

// Context yaradırıq
const MenuContext = createContext();

// Provider komponenti
export const MenuProvider = ({ children }) => {
    const [menuItems, setMenuItems] = useState(initialMenuItems);

    // Yeni yemək əlavə etmək
    const addMenuItem = (newItem) => {
        const itemWithId = {
            ...newItem,
            id: Date.now(), // Unikal ID
        };
        setMenuItems(prev => [itemWithId, ...prev]); // Əvvələ əlavə et
        return itemWithId;
    };

    // Kateqoriyaları əldə etmək
    const categories = [...new Set(menuItems.map(item => item.category))];

    // ID ilə yemək tapmaq
    const getMenuItemById = (id) => {
        return menuItems.find(item => item.id === parseInt(id));
    };

    const value = {
        menuItems,
        categories,
        addMenuItem,
        getMenuItemById,
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};

// Custom hook
export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};
