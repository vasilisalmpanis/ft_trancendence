import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import Alert			from "../components/alert";
import DeleteIcon from "../components/delete_icon";

const CreateTournament = (props) => {
	const [error, setError] = ftReact.useState("");
	const createTournament = async (count, name) => {
		const data = await apiClient.post("/tournaments", {"name": name, "description": "", "max_players": count});
		if (data.error)
			setError(data.props);
		else
		{
			await props.updateTournaments();
			props.route("/tournament", {tournament_id: data.id, name: data.name});
		}
	}
	return (
		<form
			className="d-flex flex-column gap-3"
			onSubmit={(event)=>{
				event.preventDefault();
				const name = event.target[0].value;
				let count = event.target[1].value;
				if (!count || count < 3)
					setError("You cannot create tournament with less than 3 players!")
				else
					createTournament(count, name);
			}}
		>
			<input
				className="form-control"
				placeholder="Tournament name"
				defaultValue=""
				type="text"
			/>
			<input
				className="form-control"
				placeholder="Players count"
				type="number"
				min="3"
			/>
			<button
				className="btn btn-outline-primary mb-3"
				type="submit"
			>
				Start new tournament
			</button>
			{error && <Alert msg={error}/>}
		</form>
	);
}

const TournamentCard = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	console.log(props.data, me);
	return (
		<div className="card mb-2" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item d-inline-flex align-items-baseline">
					{props.data.name}
					{props.data.player_ids.includes(me.id) &&
						<button
							className="btn d-inline p-0 ms-auto"
							onClick={async ()=>{
								await apiClient.delete("/tournaments", {tournament_id: props.data.id});
								await props.updateTournaments();
							}}
						>
							<DeleteIcon/>
						</button>
					}
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
	const getTournaments = async () => {
		let data = await apiClient.get("/tournaments");
		if (data.error)
			setError(data.error);
		else if (data && (!tournaments || (tournaments && data.length != tournaments.length)))
			setTournaments(data);
	};
	if (!tournaments && !error)
		getTournaments();
	return (
		<BarLayout route={props.route}>
			<CreateTournament route={props.route} updateTournaments={getTournaments}/>
			{
				tournaments
					? tournaments.map(tournament => <TournamentCard route={props.route} data={tournament} updateTournaments={getTournaments}/>)
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