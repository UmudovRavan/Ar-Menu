import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();

    const navLinks = [
        { path: '/', label: 'Ana Səhifə' },
        { path: '/scan', label: 'Scan' },
        { path: '/menu', label: 'Menyu' },
        { path: '/ar', label: 'AR View' }
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">🍽️ AR Menyu</Link>
            </div>
            <ul className="navbar-links">
                {navLinks.map((link) => (
                    <li key={link.path}>
                        <Link
                            to={link.path}
                            className={isActive(link.path) ? 'active' : ''}
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;
