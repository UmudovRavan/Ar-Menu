import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="page home-page">
            <div className="home-content">
                <h1>🍽️ AR Restoran Menyusu</h1>
                <p className="home-description">
                    Yeməkləri 3D-də görün, seçin və sifariş verin!
                </p>

                <div className="home-actions">
                    <Link to="/scan" className="btn btn-primary">
                        📷 Scan Et
                    </Link>
                    <Link to="/menu" className="btn btn-secondary">
                        📋 Menyuya Bax
                    </Link>
                </div>

                <div className="home-info">
                    <h3>Necə işləyir?</h3>
                    <ol>
                        <li>Masanızdakı QR kodu skan edin</li>
                        <li>Menyudan yemək seçin</li>
                        <li>Yeməyi AR-da 3D görün</li>
                        <li>Sifariş verin</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default Home;
