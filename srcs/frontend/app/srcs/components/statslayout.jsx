import { apiClient } from "../api/api_client";
import ftReact from "../ft_react";

const StatsLayout = (props) => {
	return (
		  (
				<div className="d-grid text-center">
					<div className="row g-2">
						<div className="col">
							<h5>Wins</h5>
							<h6>{`${props.stats.games_won}`}</h6>
						</div>
						<div className="col">
							<h5>Losses</h5>
							<h6>{`${props.stats.games_lost}`}</h6>
						</div>
						<div className="col">
							<h5>Points</h5>
							<h6>{`${props.stats.total_points}`}</h6>
						</div>
						<div className="col">
							<h5>Streak</h5>
							<h6>{`${props.stats.win_streaks}`}</h6>
						</div>
						<div className="col">
							<h5>Games</h5>
							<h6>{`${props.stats.games_played}`}</h6>
						</div>
					</div>
				</div>
		)
	);
}

export default StatsLayout;	