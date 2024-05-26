import * as bootstrap	from 'bootstrap';
import ftReact			from "../ft_react";
import Avatar			from "../components/avatar";
import BarLayout		from "../components/barlayout";
import { apiClient } from '../api/api_client';

const GameCard = (props) => {
	const me = props.me;
	return (
		<div className="card gap-2 p-2">
			<span>{`${props.data.player1.username} vs ${props.data.player2.username}`}</span>
			{(me.username === props.data.player1.username || me.username === props.data.player2.username) &&
				<button
					className="btn btn-outline-primary"
					onClick={()=>{props.route("/pong", {game_id: props.data.id});}}
				>JOIN</button>
			}
		</div>
	);
};
	
const UserCard = (props) => {
	return (
		<div className='d-flex flex-row gap-2 align-items-center'>
			<Avatar size={"40rem"} img={props.data.avatar}/>
			<span className="ms-1">{props.data.username}</span>
		</div>
	)
};

const FinishedTournament = (props) => {
	return (
		<div className='d-flex flex-column gap-2'> 
			<h3>{props.data.name}</h3>
			{props.data.player_ids.map(player=>(
				<div
					className="card gap-2 p-2"
					style={{backgroundColor: player.id == props.data.winner ? 'green' : 'inherit'}}
				>
					<span>{player.username}</span>
				</div>
			))}
		</div>
	);
};

let tws = null;
let tchws = null;

const LiveChat = ({msgs, chat_id, updateMsgs, route, me}) => {
	return (
		<div
			className='border border-secondary-subtle border-opacity-25 rounded shadow d-flex flex-column justify-content-between'
			style={{maxWidth: "18rem"}}
		>
			<div
				className='d-flex flex-column align-items-start p-2 text-wrap text-start overflow-y-auto'
				style={{maxHeight: "20rem", scrollbarWidth: "thin"}}
			>
				{msgs && 
					msgs.map((msg) => (
						msg.game
						? <div className="text-center w-100">
							<a
								className='link-info link-underline-info'
								style={{cursor: "pointer"}}
								onClick={()=>{route("/pong", {game_id: msg.game.id})}}
							>
								Join game with {me.id === msg.game.player1.id ? msg.game.player2.username : msg.game.player1.username}
							</a>
						</div>
						: <div className={msg.content ? '' : 'text-center w-100'} style={{maxWidth: "28ch", wordWrap: "break-word"}}>
							<strong
								className={
									msg.content
										? msg.sender === 'me' ? 'text-info' :'text-success'
										: 'text-secondary'
								}
							>
								{msg.sender}:
							</strong> <span className="text-secondary">
								{msg.content ? msg.content : msg.status}
							</span>
						</div>
					))
				}
				<div id="msgs-end" style={{visibility: "hidden"}}/>
			</div>
			<form
				onSubmit={(ev)=>{
					ev.preventDefault();
					const msg = ev.target[0].value;
					if (tchws) {
						tchws.send(JSON.stringify({
							chat_id: chat_id,
							type: "plain.message",
							content: msg
						}));
						updateMsgs(msg);
						ev.target[0].value = "";
					}
				}}
			>
				<div className="input-group mt-auto">
					<input
						required
						type="text"
						className="form-control"
						placeholder="New message"
						aria-describedby="button-addon2"
					/>
					<button
						className="btn btn-outline-secondary"
						type="submit"
						id="button-addon2"
					>Send</button>
				</div>
			</form>
		</div>
	);
};

const ModalWinner = ({winner}) => {
	return (
		<div
			className="modal fade"
			id="winnerModal"
			tabindex="-1"
			aria-labelledby="exampleModalLabel"
			aria-hidden="true"
		>
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5" id="gameoverModalLabel">Tournament is finished</h1>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						<h2>{winner ? <span>Winner: {winner.username}</span> : "No winner"}</h2>
					</div>
				</div>
			</div>
		</div>
	);
};

const Tournament = (props) => {
	const me =  JSON.parse(localStorage.getItem("me"));
	const [games, setGames] = ftReact.useState(null);
	const [users, setUsers] = ftReact.useState([]);
	const [winner, setWinner] = ftReact.useState(null);
	const [tour, setTour] = ftReact.useState(null);
	const [msgs, setMsgs] = ftReact.useState([]);
	if (!history.state)
		props.route("/tournaments");
	const id = history.state.id;
	const cleanup_ws = () => {
		console.log("cleanup_ws");
		tws && tws.close();
		tws = null;
		tchws && tchws.close();
		tchws = null;
	};
	const updateMsgs = (msg) => {
		setMsgs([...msgs, {content: msg, sender: 'me'}]);
		setTimeout(
			() => document.getElementById("msgs-end")?.scrollIntoView(),
			100
		);
	};
	ftReact.useEffect(()=>{
		if (!tws) {
			tws = new WebSocket(
				`wss://api.${window.location.hostname}/tournament`,
				["Authorization", localStorage.getItem("access_token")]
			);
		};
		if (tws) {
			tws.addEventListener('message', ev => {
				const data = JSON.parse(ev.data);
				if ('users' in data) {
					console.log("setting", ...data.users);
					setUsers([...data.users]);
				}
				if ('message' in data && 'games' in data['message'])
				{
					data.message.games.forEach(game=>{
						if (me.id === game.player1.id || me.id === game.player2.id)
							setMsgs([...msgs, {game: game}])
					})
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
			const hideModal = () => {
				setTour(null);
			}
			document.getElementById("winnerModal")?.removeEventListener('hide.bs.modal', hideModal);
			document.getElementById("winnerModal")?.addEventListener('hide.bs.modal', hideModal);
		}
		if (!tchws) {
			tchws = new WebSocket(
				`wss://api.${window.location.hostname}/ws/chat/tournament/${id}/`,
				["Authorization", localStorage.getItem("access_token")]
			);
		}
		if (tchws) {
			tchws.addEventListener('message', ev => {
				const data = JSON.parse(ev.data);
				if ("content" in data || 'status' in data) {
					setMsgs([...msgs, data]);
					setTimeout(
						() => document.getElementById("msgs-end")?.scrollIntoView(),
						100
					);
				};
			});
		}
		return cleanup_ws;
	},[users, games, winner, msgs, setUsers, setGames, setWinner, setMsgs]);
	ftReact.useEffect(async () => {

		const getTour = async () => {
			const resp = await apiClient.get(`/tournaments/${id}`)
			setTour(resp);
		};
		if (!tour) {
			await getTour();
		}
	},[tour, setTour]);
	return (
		<BarLayout route={props.route}>
			{tour
			? (tour.winner
				? <FinishedTournament data={tour}/>
				: <div>
					<h3 className='text-primary'>Tournament {tour.name} for {tour.max_players} players</h3>
					<div className='d-flex flex-wrap justify-content-center gap-4 mt-5'>
						<div className='card p-3 shadow' style={{minWidth: '18rem'}}>
							<h5 className="mt-3">Games:</h5>
							{games && games.length
								? games.map(game => <GameCard route={props.route} data={game} me={me}/>)
								: <span>waiting games</span>
							}
						</div>
						<div className='card p-3 shadow' style={{minWidth: '18rem'}}>
							<h5 className="mt-3">Active users:</h5>
							{users && users.length ? users.map(user => <UserCard data={user}/>) : <span>waiting users</span>}
						</div>
						<LiveChat
							msgs={msgs}
							chat_id={id}
							updateMsgs={updateMsgs}
							route={props.route}
							me={me}
						/>
					</div>
					<ModalWinner winner={winner}/>
				</div>)
			: (
				<div className="spinner-grow" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			)
		}
		</BarLayout>
	);
};

export default Tournament;
