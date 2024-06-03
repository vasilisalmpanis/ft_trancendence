import * as bootstrap	from 'bootstrap';
import './scss/styles.scss';
import ftReact				from "./ft_react";
import {Router, Route}		from "./router";
import Main 				from './pages/main';
import { useTheme } 		from './theme/theme';
import Profile				from './pages/profile';
import Signup				from './pages/signup';
import Signin				from './pages/signin';
import Pong 				from './pages/pong';
import Users				from './pages/users';
import Games				from './pages/games';
import Tournaments			from './pages/tournaments';
import Tournament			from './pages/tournament';
import TFA					from './pages/2fa';
import Leaderboard			from './pages/leaderboard';
import User					from './pages/user';
import UserFriendsLayout 	from './pages/user_friends';
import ReRoutePage			from './pages/reroute';
import LocalGame			from './pages/local_game';
import Sent 				from './pages/sent';
import Incoming 			from './pages/incoming';
import Blocked 				from './pages/blocked';
import LocalTournament		from './pages/local_tournament';
import Chats				from './pages/chat';

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
				<Route fallback path="/" element={<Main/>}/>
				<Route login path="/signin" element={<Signin/>}/>
				<Route path="/signup" element={<Signup/>}/>
				<Route path="/local-game" element={<LocalGame/>}/>
				<Route path="/local-tournament" element={<LocalTournament/>}/>
				<Route auth path="/me" element={<Profile/>}/>
				<Route auth path="/pong" element={<Pong/>}/>
				<Route auth path="/users" element={<Users/>}/>
				<Route auth path="/users/{id}" element={<User/>}/>
				<Route auth path="/games" element={<Games/>}/>
				<Route auth path="/tournaments" element={<Tournaments/>}/>
				<Route auth path="/tournaments/{id}" element={<Tournament/>}/>
				<Route auth path="/leaderboard" element={<Leaderboard/>}/>
				<Route auth path="/user-friends/{id}" element={<UserFriendsLayout/>}/>
				<Route auth path="/reroute" element={<ReRoutePage/>}/>
				<Route path="/2fa" element={<TFA/>}/>
				<Route auth path="/friendrequests/sent" element={<Sent/>}/>
				<Route auth path="/friendrequests/incoming" element={<Incoming/>}/>
				<Route auth path="/blocked" element={<Blocked/>}/>
				<Route fallback auth path="/chats" element={<Chats/>}/>
			</Router>
		</div>
	);
}

const root = document.getElementById("root");
ftReact.render(<App/>, root);
