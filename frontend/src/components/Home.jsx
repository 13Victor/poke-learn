import { Link } from 'react-router-dom';

function Home() {
    return <>
        <h1>Bienvenido a la App</h1>
        <nav>
            <Link to="/auth/login">Login</Link> | <Link to="/auth/register">Register</Link>
        </nav>
    </>
}

export default Home;