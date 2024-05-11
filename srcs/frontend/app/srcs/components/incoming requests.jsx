import ftReact              from "../ft_react";
import FriendRequestLayout  from "./friend_request";
import { apiClient }        from "../api/api_client";

let reroute_number = -1;

const IncomingRequests = (props) => {
	return (
		<ul class="list-group">
			<li className="list-group-item">
				{ (props.requests && props.requests.length > reroute_number)
					?
					<button className="btn" onClick={() => props.route('/friendrequests/incoming')}>
						<h5 className="card-title">Friend Requests</h5>
					</button>
					:
					<h5 className="card-title">Friend Requests</h5>
				}
			</li>
			{
				props.requests && props.requests.length
				?
				props.requests.map((request, i) => {
					return (
						<FriendRequestLayout request={request} i={i} setter={props.setter} data={props.requests} sent={props.sent}/>
					);
				})
				: <li className="list-group-item">You have no pending requests</li>
			}
		</ul>
);
}

export default IncomingRequests;