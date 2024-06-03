import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import Alert			from "../components/alert";
import DeleteIcon from "../components/delete_icon";

const CreateLocalTournament = (props) => {
	return (
		<div className="d-flex flex-column gap-2 mb-3 p-2">
			<h2>Local Tournament</h2>
			<button
				className="btn btn-outline-primary mb-2"
				onClick={()=>{props.route("/local-tournament");}}
			>
				Create local tournament
			</button>
		</div>
	);
}

const CreateTournament = (props) => {
	const [error, setError] = ftReact.useState("");
	const createTournament = async (count, name) => {
		const data = await apiClient.post("/tournaments", {"name": name, "description": "", "max_players": count});
		if (data.error)
			setError(data.props);
		else
		{
			await props.updateTournaments();
			props.route(`/tournaments/${data.id}`);
		}
	}
	return (
		<div className="d-flex flex-column gap-2 p-2">
		<h2>Online Tournament</h2>
		<form
			className="d-flex flex-column gap-3"
			onSubmit={(event)=>{
				event.preventDefault();
				const name = event.target[0].value;
				let count = event.target[1].value;
				if (!count || count < 3)
					setError("You cannot create tournament with less than 3 players!");
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
		</div>
	);
}

const TournamentCard = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	return (
		<div className="card mb-2" style="width: 18rem;">
			<ul className="list-group list-group-flush">
				<li className="list-group-item d-inline-flex align-items-baseline justify-content-between">
					<span
						className={props.data.status !== 'closed' ? "text-success font-weight-bold" : "text-secondary"}
					>
						{props.data.name}
					</span>
					{me && props.data.status !== 'closed' && (props.data.player_ids.includes(me.id) || props.data.player_ids.length != props.data.max_players)
						?	<div>
								<button
									className="btn d-inline p-0"
									onClick={async ()=>{
										if (!props.data.player_ids.includes(me.id)) {
											const resp = await apiClient.put("/tournaments", {tournament_id: props.data.id});
											if (resp.error) {
												return ;
											}
										}
										props.route(`/tournaments/${props.data.id}`);
									}}
								>	
									{props.data.player_ids.includes(me.id) ? "ENTER" : "JOIN"}
								</button>
								{props.data.player_ids.includes(me.id) &&
								props.data.status === 'open' &&
									<button
										className="btn d-inline p-0 ms-1"
										onClick={async ()=>{
											const data = await apiClient.delete("/tournaments", {tournament_id: props.data.id});
											await props.updateTournaments();
										}}
									>
										<DeleteIcon/>
									</button>
								}
							</div>
						:	<button
								className="btn d-inline p-0 ms-auto"
								onClick={async ()=>{
									props.route(`/tournaments/${props.data.id}`);
								}}
							>
								SHOW
							</button>
					}
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
		else if (data)
			setTournaments([...data]);
	};
	ftReact.useEffect(async ()=>{
		if (!tournaments && !error)
			await getTournaments();
	}, [tournaments, setTournaments, error, setError]);
	return (
		<BarLayout route={props.route}>

			<CreateLocalTournament route={props.route}/>
			<CreateTournament route={props.route} updateTournaments={getTournaments}/>
			{
				tournaments
					? tournaments.map(tournament => <TournamentCard route={props.route} 
																	data={tournament} 
																	updateTournaments={getTournaments} 
																	setTournaments={setTournaments}
													/>)
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
};

export default Tournaments;