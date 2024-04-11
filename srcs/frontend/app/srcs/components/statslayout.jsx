import ftReact from "../ft_react";

const StatsLayout = (props) => {
	return (
		<div className="card ml-2" style="width: 18rem;">
			<div className="card-body">
				<h5 className="card-title">My Stats</h5>
			</div>
			<ul className="list-group list-group-flush">
				<li className="list-group-item">Games Played: {`${props.data.games_won}`}</li>
				<li className="list-group-item">Games Won: {`${props.data.games_lost}`}</li>
				<li className="list-group-item">Games Lost: {`${props.data.games_played}`}</li>
				<li className="list-group-item">Total Points: {`${props.data.total_points}`}</li>
				<li className="list-group-item">Win Streaks: {`${props.data.win_streaks}`}</li>
			</ul>
		</div>
	);

}

export default StatsLayout;