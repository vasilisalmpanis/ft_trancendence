import * as bootstrap	from 'bootstrap';
import './scss/styles.scss';
// import './styles/styles.css';
import ftReact			from "./ft_react";
import {Router, Route}	from "./router";
import Main 			from './pages/main';
import { useTheme } 	from './theme/theme';
import Profile			from './pages/profile';
import Signup			from './pages/signup';
import Signin			from './pages/signin';
import Pong 			from './pages/pong';
import Users			from './pages/users';
import Games			from './pages/games';
import Tournaments		from './pages/tournaments';
import Tournament		from './pages/tournament';
import Leaderboard		from './pages/leaderboard';
import User				from './pages/user';

const A = (props) => <button onClick={(ev)=>props.route("/b")}>to B</button>
const B = (props) => <button onClick={(ev)=>props.route("/a")}>to A</button>

const App = (props) => {
	const [theme, setTheme] = useTheme();
	setTheme("auto");
	return (
		<div className="" style={{
			width: "100vw",
			minHeight: "90vh",
			display: "grid",
		}}>
			<Router>
				<Route login path="/signin" element={<Signin/>}/>
				<Route path="/signup" element={<Signup/>}/>
				<Route auth path="/me" element={<Profile/>}/>
				<Route auth path="/pong" element={<Pong/>}/>
				<Route auth path="/users" element={<Users/>}/>
				<Route auth path="/games" element={<Games/>}/>
				<Route auth path="/tournaments" element={<Tournaments/>}/>
				<Route auth path="/tournament" element={<Tournament/>}/>
				<Route auth path="/leaderboard" element={<Leaderboard/>}/>
				<Route auth path="/user" element={<User/>}/>
				<Route auth path="/a" element={<A/>}/>
				<Route auth path="/b" element={<B/>}/>
				<Route fallback auth path="/" element={<Main/>}/>
			</Router>
		</div>
	);
}

const root = document.getElementById("root");
ftReact.render(<App/>, root);
