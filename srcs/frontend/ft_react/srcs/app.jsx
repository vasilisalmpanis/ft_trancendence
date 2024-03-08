import ftReact from "./ft_react.js";

const Component = (props) => {
	const [value, setValue] = ftReact.useState("text");
	return (
		<div style="
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 10px;
			border: 1px solid black;
		">
			<input onInput ={ev=>setValue(ev.target.value)}/>
			<br/>
			<span>{value}</span>
			<br/>
			<input onInput ={ev=>props.updateVal(Number(ev.target.value))} value={props.val}/>
		</div>
	);
};

const App = (props) => {

	const [counter, setCounter] = ftReact.useState(0);
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
				onClick={()=>setCounter(counter => counter + 1)}
			/>
			<br/>
			<span style="
				margin-top: 10px;
				font-size: 48px;
			">
				{counter}
			</span>
			<Component updateVal={(val)=>setCounter(val)} val={counter}/>
		</div>
	);
};

const el = <App name="test"/>;

const container = document.getElementById("root");
ftReact.render(
	el, 
	container
);