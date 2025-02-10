import { Link } from 'react-router-dom';

function Home() {
    return <>
        <h1>Bienvenido a la App</h1>
        <nav>
            <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
        </nav>
    </>
}

export default Home;