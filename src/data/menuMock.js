// Mock backend data for menu items
// Bu data sonradan real backend-dən gələcək

export const menuItems = [
    {
        id: 1,
        name: "Burger",
        description: "Ləziz mal əti burgeri",
        price: 12.99,
        category: "Əsas Yeməklər",
        thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
        model3D: "/models/burger.glb"
    },
    {
        id: 2,
        name: "Pizza",
        description: "İtalyan pizzası",
        price: 15.99,
        category: "Əsas Yeməklər",
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
        model3D: "/models/pizza.glb"
    },
    {
        id: 3,
        name: "Salat",
        description: "Təzə tərəvəz salatı",
        price: 8.99,
        category: "Qəlyanaltılar",
        thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop",
        model3D: "/models/salad.glb"
    },
    {
        id: 4,
        name: "Kabab",
        description: "Ləziz Azərbaycan kababı",
        price: 18.99,
        category: "Əsas Yeməklər",
        thumbnail: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=300&h=200&fit=crop",
        model3D: "/models/kebab.glb"
    },
    {
        id: 5,
        name: "Dolma",
        description: "Yarpaq dolması",
        price: 14.99,
        category: "Əsas Yeməklər",
        thumbnail: "https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=300&h=200&fit=crop",
        model3D: "" // Default model istifadə olunacaq
    },
    {
        id: 6,
        name: "Plov",
        description: "Azərbaycan şah plovü",
        price: 16.99,
        category: "Əsas Yeməklər",
        thumbnail: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=200&fit=crop",
        model3D: "" // Default model istifadə olunacaq
    },
    {
        id: 7,
        name: "Qutab",
        description: "Göy qutabı",
        price: 7.99,
        category: "Qəlyanaltılar",
        thumbnail: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop",
        model3D: ""
    },
    {
        id: 8,
        name: "Pakhlava",
        description: "Azərbaycan paxlavası",
        price: 6.99,
        category: "Desertlər",
        thumbnail: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=300&h=200&fit=crop",
        model3D: ""
    }
];

// Kateqoriyalar üçün helper
export const categories = [...new Set(menuItems.map(item => item.category))];

// ID ilə yemək tapmaq üçün helper
export const getMenuItemById = (id) => {
    return menuItems.find(item => item.id === parseInt(id));
};

// Default 3D model
export const DEFAULT_MODEL = "/models/burger.glb";
