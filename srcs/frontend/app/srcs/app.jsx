import './scss/styles.scss';
import * as bootstrap	from 'bootstrap';
import ftReact			from "./ft_react";
import {Router, Route}	from "./router";
import Main 			from './pages/main';
import Login			from "./pages/login";
import Test 			from './pages/test';
import { useTheme } 	from './theme/theme';
import Layout			from './components/layout';
import Profile			from './pages/profile';

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
				<Route login path="/login" element={<Login/>}/>
				<Route auth path="/test" element={<Test/>}/>
				<Route auth path="/me" element={<Profile/>}/>
			</Router>
		</div>
	);
}

const root = document.getElementById("root");
ftReact.render(<App/>, root);
