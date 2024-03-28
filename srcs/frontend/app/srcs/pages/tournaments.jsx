import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import Alert			from "../components/alert";

const CreateTournament = (props) => {
	const createTournament = async () => {
		const data = await apiClient.post("/tournaments");
		await props.updateTournaments();
		props.route("/tournament", {tournament_id: data.id});
	}
	return (
		<button
			className="btn btn-outline-primary mb-3"
			onClick={createTournament}
		>
			Start new tournament
		</button>
	);
}

const TournamentCard = (props) => {
	console.log(props.data);
	const me = JSON.parse(localStorage.getItem("me"));
	return (
		<div className="card mb-2" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item d-inline-flex align-items-baseline">
					{props.data.players[0]}
					<button
						className="btn d-inline p-0 ms-auto"
						onClick={()=>{
							props.route("/tournament", {game_id: props.data.id});
						}}
					>
						JOIN
					</button>
				</li>
			</ul>
		</div>
	);
}

const Tournaments = (props) => {
	const [tournaments, setTournaments] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	const getTounaments = async () => {
		let data = await apiClient.get("/tournaments");
		if (data.error)
			setError(data.error);
		else if (data && (!tournaments || (tournaments && data.length != tournaments.length)))
			setTournaments(data);
	};
	if (!tournaments && !error)
		getTounaments();
	return (
		<BarLayout route={props.route}>
			<CreateTournament route={props.route} updateGames={getTounaments}/>
			{
				tournaments
					? tournaments.map(tournament => <TournamentCard route={props.route} data={tournament} updateTournaments={getTounaments}/>)
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

export default Tournaments;