import ftReact from "./index.js";

const App = (props) => {

	//const [counter, setCounter] = ftReact.useState(0);
	return (
		<div style="
			display: flex;
			flex-direction: column;
			align-items: center;
		">
			<h1>
				Hi {props.name}
			</h1>
			<button
				style="height: 40px; width: 40px;"
				//onClick={()=>setCounter(counter => counter + 1)}
			/>
			<br/>
			<span style="
				margin-top: 10px;
				font-size: 48px;
			">
				{"counter"}
			</span>
		</div>
	);
};

const container = document.getElementById("root");
ftReact.render(
	App({name: "test"}), 
	container
);