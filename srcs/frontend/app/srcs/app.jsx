import './scss/styles.scss';
import * as bootstrap	from 'bootstrap';
import ftReact			from "./ft_react";
import {Router, Route}	from "./router";
import Main 			from './pages/main';
import Login			from "./pages/login";
import Test 			from './pages/test';
import { useTheme } 	from './theme/theme';

const App = (props) => {
	const [theme, setTheme] = useTheme();
	setTheme("auto");
	return (
		<div style={{
			width: "100vw",
			height: "100vh",
		}}>
			<Router>
				<Route path="/" element={<Main/>}/>
				<Route path="/login" element={<Login/>}/>
				<Route path="/test" element={<Test/>}/>
			</Router>
		</div>
	);
}

const root = document.getElementById("root");
ftReact.render(<App/>, root);
