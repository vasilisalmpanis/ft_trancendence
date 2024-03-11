import ftReact	from "./ft_react";
import Router	from "./router";
// Import our custom CSS
import './scss/styles.scss';

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap';

const Cmp = () => {
	const [count, setCount] = ftReact.useState(6);
	return (
		<div>
			<span style="color: red;" >cmp    </span>
			<br/>
			<span style="color: black;" >{count}</span>
			<br/>
			<button className="btn btn-outline-danger" onClick={() => setCount(count + 1)}>Push me</button>
			<div className="container py-4 px-3 mx-auto">
				<h1>Hello, Bootstrap and Webpack!</h1>
				<button className="btn btn-primary">Primary button</button>
		  	</div>
		</div>
	);
}

const App = (
	<div style="width: 100vw; height: 100vh; background-color: light-grey;">
		<Cmp/>
	</div>
);
const root = document.getElementById("root");

ftReact.render(App, root);
