import * as bootstrap	from 'bootstrap';
import ftReact			from "../ft_react";
import Avatar			from "../components/avatar";
import BarLayout		from "../components/barlayout";

const GameCard = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	return (
		<div className="card gap-2 p-2">
			<span>{`${props.data.player1.username} vs ${props.data.player2.username}`}</span>
			{(me.username === props.data.player1.username || me.username === props.data.player2.username) &&
				<button
					className="btn btn-outline-primary"
					onClick={()=>{props.route("/pong", {game_id: props.data.id, from: "/tournament"});}}
				>JOIN</button>
			}
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

let tws = null;
const Tournament = (props) => {
	const [games, setGames] = ftReact.useState(null);
	const [users, setUsers] = ftReact.useState([]);
	const [winner, setWinner] = ftReact.useState(null);
	const cleanup_ws = () => {
		console.log("cleanup_ws");
		tws && tws.close();
		tws = null;
	};
	if (!history.state)
		props.route("/tournaments");
	ftReact.useEffect(()=>{
		if (!tws) {
			tws = new WebSocket(
				`ws://${window.location.hostname}:8000/tournament`,
				["Authorization", localStorage.getItem("access_token")]
			);
		};
		if (tws) {
			tws.addEventListener('message', ev => {
				const data = JSON.parse(ev.data);
				//console.log("ws msg: ", data);
				if ('users' in data)
					setUsers([...data.users])
				if ('message' in data && 'games' in data['message'])
				{
					setGames([...data.message.games])
				}
				else if ('message' in data && 'user_joined' in data['message']) {
					const new_user = data['message']['user_joined'];
					if (!users.find(user => user.id === new_user.id))
						setUsers([...users, new_user]);
				}
				else if ('message' in data && 'user_left' in data['message']) {
					const left_user = data['message']['user_left'];
					setUsers([...users.filter(user => user.id !== left_user.id)]);
				}
				else if ('message' in data && 'winner' in data['message']) {
					setWinner(data['message']['winner']);
					const winnerModal = new bootstrap.Modal('#winnerModal', {});
					winnerModal.show();
				}
			});
	 	}
		return cleanup_ws;
	},[users, games, winner]);
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
			<button className="btn btn-primary-outline" onClick={()=>{
				if (tws) {
					tws.close();
					tws = null;
				}
			}}>CLOSE</button>
			<div
				className="modal fade"
				id="winnerModal"
				tabindex="-1"
				aria-labelledby="exampleModalLabel"
				aria-hidden="true"
			>
				<div className="modal-dialog modal-dialog-centered">
					<div className="modal-content">
						{winner ? <span>Winner: {winner.username}</span> : "No winner"}
					</div>
				</div>
			</div>
		</BarLayout>
	);
};

export default Tournament;
