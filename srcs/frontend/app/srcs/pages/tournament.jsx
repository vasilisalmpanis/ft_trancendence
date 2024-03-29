import BarLayout from "../components/barlayout";
import ftReact			from "../ft_react";

const Tournament = (props) => {
	let ws = null;
	const cleanup = () => {
		console.log("cleanup");
		ws && ws.close();
		ws = null;
	}
	ftReact.useEffect(()=>{
		if (!ws) {
			ws = new WebSocket(
				`ws://${window.location.hostname}:8000/tournament`,
				["Authorization", localStorage.getItem("access_token")]
			);
			ws.addEventListener('message', ev => {
				const data = JSON.parse(ev.data);
				console.log(data);
			});
		};
		return cleanup;
	},[])
	return (
		<BarLayout route={props.route}>
			<span>It's a tournament {history.state.name}</span>
		</BarLayout>
	);
}

export default Tournament;