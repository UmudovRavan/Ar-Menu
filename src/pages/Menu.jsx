import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';

const Menu = () => {
    const navigate = useNavigate();
    const { menuItems, categories } = useMenu();
    const [selectedCategory, setSelectedCategory] = useState('Hamısı');

    const filteredItems = selectedCategory === 'Hamısı'
        ? menuItems
        : menuItems.filter(item => item.category === selectedCategory);

    // AR səhifəsinə yemək datasını state ilə ötür
    const handleViewAR = (item) => {
        navigate('/ar', {
            state: {
                food: {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    thumbnail: item.thumbnail,
                    model3D: item.model3D,
                    category: item.category
                }
            }
        });
    };

    return (
        <div className="page menu-page">
            <h1>📋 Menyu</h1>

            {/* Category Filter */}
            <div className="category-filter">
                <button
                    className={`category-btn ${selectedCategory === 'Hamısı' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('Hamısı')}
                >
                    Hamısı
                </button>
                {categories.map((category) => (
                    <button
                        key={category}
                        className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Menu Grid */}
            <div className="menu-grid">
                {filteredItems.map((item) => (
                    <div
                        key={item.id}
                        className={`menu-card ${item.category === 'Skan Edilənlər' ? 'scanned-item' : ''}`}
                    >
                        {item.category === 'Skan Edilənlər' && (
                            <div className="scanned-badge">📷 Yeni Skan</div>
                        )}
                        <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="menu-card-image"
                        />
                        <div className="menu-card-content">
                            <h3>{item.name}</h3>
                            <p className="menu-card-description">{item.description}</p>
                            <p className="menu-card-price">{item.price.toFixed(2)} ₼</p>
                            <button
                                className="btn btn-ar"
                                onClick={() => handleViewAR(item)}
                            >
                                👁️ AR-da Bax
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Menu;
