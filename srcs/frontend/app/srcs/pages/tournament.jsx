import Avatar		from "../components/avatar";
import BarLayout	from "../components/barlayout";
import ftReact		from "../ft_react";

const GameCard = (props) => {
	return (
		<div className="card gap-2 p-2">
			<span>{`${props.data.player1} vs ${props.data.player2}`}</span>
			<button
				className="btn btn-outline-primary"
				onClick={()=>{props.route("/pong", {game_id: props.data.id, from: "/tournament"});}}
			>JOIN</button>
		</div>
	);
};
	
const UserCard = (props) => {
	return (
		<div>
			{/* <Avatar size={"46rem"} img={props.data.avatar}/> */}
			<span className="ms-1">{props.data.username}</span>
		</div>
	)
};

let ws = null;
const Tournament = (props) => {
	const [games, setGames] = ftReact.useState(null);
	const [users, setUsers] = ftReact.useState([]);
	const cleanup = () => {
		console.log("cleanup");
		ws && ws.close();
		ws = null;
	};
	//ftReact.useEffect(()=>{
		if (!history.state)
			props.route("/tournaments");
		if (!ws) {
			ws = new WebSocket(
				`ws://${window.location.hostname}:8000/tournament`,
				["Authorization", localStorage.getItem("access_token")]
			);
		};
		if (ws) {
			ws.addEventListener('message', ev => {
				const data = JSON.parse(ev.data);
				console.log("ws msg: ", data);
				if ('users' in data)
					setUsers([...users,
				 ...data.users])
				if ('message' in data && 'games' in data['message'])
				{
					console.log("setGames");
					setGames([...data.message.games])
				}
				else if ('message' in data && 'user_joined' in data['message']) {
					setUsers([...users, data['message']['user_joined']]);
				}
			});
		}
		//return cleanup;
	//},[]);
	return (
		<BarLayout route={props.route}>
			<h3>It's a tournament {history.state?.name}</h3>
			<div>
				<h5 className="mt-3">Games:</h5>
				{games && games.length ? games.map(game => <GameCard route={props.route} data={game}/>) : <span>waiting games</span>}
			</div>
			<div>
				<h5 className="mt-3">Active users:</h5>
				{users && users.length ? users.map(user => <UserCard data={user}/>) : <span>waiting users</span>}
			</div>
		</BarLayout>
	);
};

export default Tournament;
