import './scss/styles.scss';
import * as bootstrap	from 'bootstrap';
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

const App = (props) => {
	const [theme, setTheme] = useTheme();
	setTheme("auto");
	return (
		<div style={{
			width: "100vw",
			height: "90vh",
		}}>
			<Router>
				<Route fallback auth path="/" element={<Main/>}/>
				<Route login path="/signin" element={<Signin/>}/>
				<Route path="/signup" element={<Signup/>}/>
				<Route auth path="/me" element={<Profile/>}/>
				<Route auth path="/pong" element={<Pong/>}/>
				<Route auth path="/users" element={<Users/>}/>
				<Route auth path="/games" element={<Games/>}/>
				<Route auth path="/tournaments" element={<Tournaments/>}/>
				<Route auth path="/tournament" element={<Tournament/>}/>
			</Router>
		</div>
	);
}

const root = document.getElementById("root");
ftReact.render(<App/>, root);
