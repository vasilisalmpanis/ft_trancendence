import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import {
	C_PROFILE_HEADER,
	C_PROFILE_USERNAME
}						from "../conf/content_en";
import Alert from "../components/alert";
import DeleteIcon from "../components/delete_icon";

const CreateGame = (props) => {
	const createGame = async () => {
		const data = await apiClient.post("/games");
		if (data.error)
			return ;
		await props.updateGames();
		props.route("/pong", {game_id: data.id});
	}
	return (
		<div className="d-flex flex-column gap-2">
			<button
				className="btn btn-outline-primary mb-3"
				onClick={()=>{
					props.route("/local-game");
				}}
			>
				Play Locally
			</button>
			<button
				className="btn btn-outline-primary mb-3"
				onClick={createGame}
			>
				Create new game
			</button>
		</div>
	);
}

const GameCard = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	return (
		<div className="card mb-2" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item d-inline-flex align-items-baseline">
					{props.data.player1.username}
					{me && props.data.player1.username === me.username &&
						<button
							className="btn d-inline p-0 ms-auto"
							onClick={async ()=>{
								await apiClient.delete("/games", {game_id: props.data.id});
								await props.updateGames();
							}}
						>
							<DeleteIcon/>
						</button>
					}
					{(!props.data.player2
						|| props.data.player2.username === me.username
						|| props.data.player1.username === me.username ) &&
						<button
							className="btn d-inline p-0 ms-auto"
							onClick={()=>{
								props.route("/pong", {game_id: props.data.id});
							}}
						>
							JOIN
						</button>
					}
				</li>
			</ul>
		</div>
	);
}

const Games = (props) => {
	const [games, setGames] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	const getGames = async () => {
		let data = await apiClient.get("/games", {type: "paused", me: true});
		if (data.error === 401)
			return ;
		else if (data.error) {
			setError(data.error);
			return ;
		}
		if (data.length)
			props.route("/pong", {game_id: data[0].id});
		data = await apiClient.get("/games", {type: "pending"});
		if (data.error === 401)
			return ;
		else if (data.error) {
			setError(data.error);
			return ;
		}
		else if (data && (!games || (games && data.length != games.length)))
			setGames(data);
	};
	ftReact.useEffect(async () => {
		if (!games && !error)
			await getGames();
	}, [games, setGames, error, setError]);
	return (
		<BarLayout route={props.route}>
			<CreateGame route={props.route} updateGames={getGames}/>
			{
				games
					? games.map(game => <GameCard route={props.route} data={game} updateGames={getGames}/>)
					: error
						? <Alert msg={error}/>
						: (
							<div className="spinner-grow" role="status">
								<span className="visually-hidden">Loading...</span>
				  			</div>
						)
			}
		</BarLayout>
	);
}

export default Games;