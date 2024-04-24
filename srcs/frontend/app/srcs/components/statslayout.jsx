import { apiClient } from "../api/api_client";
import ftReact from "../ft_react";

const StatsLayout = (props) => {
	const [stats, setStats] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	ftReact.useEffect(async () => {
		const getMyStats = async () => {
			const data = await apiClient.get(`/users/${props.user_id}/stats`);
			if (data.error)
				setError(data.error);
			else if (data && !stats)
				setStats(data);
			console.log(data)
		}
		if (!stats && !error)
			await getMyStats();
	},[stats]);
	return (
		<div className="card h-100" style="width: 18rem;">
			<div className="card-header">
				<h5 className="card-title">My Stats</h5>
			</div>
			<div className="card-body">
			{stats
				? <ul className="list-group list-group-flush">
					<li className="list-group-item">Games Played: {`${stats.games_won}`}</li>
					<li className="list-group-item">Games Won: {`${stats.games_lost}`}</li>
					<li className="list-group-item">Games Lost: {`${stats.games_played}`}</li>
					<li className="list-group-item">Total Points: {`${stats.total_points}`}</li>
					<li className="list-group-item">Win Streaks: {`${stats.win_streaks}`}</li>
				</ul>
				: (
					<div className="spinner-grow" role="status">
						<span className="visually-hidden">Loading...</span>
					</div>
				)
			}
			</div>
		</div>
	);

}

export default StatsLayout;	