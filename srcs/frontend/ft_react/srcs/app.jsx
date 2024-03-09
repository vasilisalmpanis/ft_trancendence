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
			{props.idx ? props.idx : ""}
			<input style="color: green" onInput ={ev=>setValue(ev.target.value)}/>
			<br/>
			<span>{value}</span>
			<br/>
			<input onInput ={ev=>props.updateVal(Number(ev.target.value))} value={props.val}/>
		</div>
	);
};

const App = (props) => {

	const [counter, setCounter] = ftReact.useState(0);
	const [components, setComponents] = ftReact.useState([]);
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
			>+1</button>
			<br/>
			<span style="
				margin-top: 10px;
				font-size: 48px;
			">
				{counter}
			</span>
			<br/>
			<div>
				<button
					style="height: 40px; width: 40px; margin-right: 10px;"
					onClick={()=>setComponents(cmp =>[...cmp, cmp.length + 1])}
				>+</button>
				<button
					style="height: 40px; width: 40px;"
					onClick={()=>setComponents(cmp =>{cmp.splice(0, 1); return ([...cmp]);})}
				>-</button>
			</div>
			<br/>
			<div>
				{
					components && components.length
						? components.map(key => (
							<Component
								updateVal = {setCounter}
								val = {counter}
								idx = {key}
							/>
						))
						: <span>Empty</span>
				}
			</div>
		</div>
	);
};

const el = <App name="test"/>;

const container = document.getElementById("root");
ftReact.render(
	el, 
	container
);