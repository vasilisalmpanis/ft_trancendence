import BarLayout from "../components/barlayout";
import ftReact			from "../ft_react";

const GameCard = (props) => {
	return (
		<span>{JSON.stringify(props.data.group)}</span>
	);
}

let ws = null;
const Tournament = (props) => {
	const [games, setGames] = ftReact.useState([]);
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
				if ('group' in data)
					setGames([...games, data])
			});
		};
		//return cleanup;
	},[])
	return (
		<BarLayout route={props.route}>
			<span>It's a tournament {history.state.name}</span>
			{games && games.length ? games.map(game => <GameCard data={game}/>) : <span>waiting games</span>}
		</BarLayout>
	);
}

export default Tournament;