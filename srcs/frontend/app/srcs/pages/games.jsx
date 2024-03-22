import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import {
	C_PROFILE_HEADER,
	C_PROFILE_USERNAME
}						from "../conf/content_en";

const CreateGame = (props) => {
	const createGame = async () => {
		await apiClient.post("/games");
		await props.updateGames();
	}
	return (
		<button
			className="btn btn-primary"
			onClick={createGame}
		>
			Create new game
		</button>
	);
}

const GameCard = (props) => {
	return (
		<div className="card mb-2" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item">{props.data.players[0]}</li>
				<button
					className="btn btn-outline-primary"
					onClick={async ()=>{
						await apiClient.delete("/games", {game_id: props.data.id});
						await props.updateGames();
					}}
				>
					{"\uF78B"}
				</button>
			</ul>
		</div>
	);
}

const Games = (props) => {
	const [games, setGames] = ftReact.useState(null);
	const getGames = async () => {
		const resp = await apiClient.get("/games", {type: "pending"});
		const data = await resp.json();
		if (data && (!games || (games && data.length != games.length)))
			setGames(data);
	};
	ftReact.useEffect(()=>{
		getGames();
	},[games]);
	return (
		<BarLayout route={props.route}>
			<CreateGame updateGames={getGames}/>
			{
				games
					? games.map(game => <GameCard data={game} updateGames={getGames}/>)
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