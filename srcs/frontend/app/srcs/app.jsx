import './scss/styles.scss';
	import * as bootstrap	from 'bootstrap';
import ftReact			from "./ft_react";
import Router			from "./router";
import Login			from "./pages/login";
import Layout			from './components/layout';

const App = (
	<div style="
		width: 100vw;
		height: 100vh;
		background-color: light-grey;
	">
		<Layout>
			<Login/>
		</Layout>
	</div>
);

const root = document.getElementById("root");
ftReact.render(App, root);
