import ftReact  		from "../ft_react";
import Avatar   		from "./avatar";
import { apiClient }	from "../api/api_client";

let reroute_number = -1;

const BlockedUsers = (props) => {
	const unblockUser = async (user_id) => {
		const data = await apiClient.put(`/block`, {user_id: user_id});
		if (data.error)
			return ;
		else
			props.setter(null);
	}
	return (
				<ul className="list-group">
					<li className="list-group-item">
						{ (props.users && props.users.length > reroute_number)
							?
							<button className="btn" onClick={() => props.route('/blocked')}>
								<h5 className="card-title">Blocked Users</h5>
							</button>
							:
							<h5 className="card-title">Blocked Users</h5>
						}
					</li>
					{
							(props.users && props.users.length)
								?
								props.users.map((user) => {
									return (
										<li className="list-group-item d-flex justify-content-between align-items-center gap-2">
											<Avatar img={user.avatar} size="50px"/>
											<span className="">{user.username}</span>
											<button className="btn btn-primary" onClick={() => unblockUser(user.id)}>Unblock</button>
										</li>
								)}
								)
								:
								<li className="list-group-item">No blocked users</li>
					}
				</ul>
	)
}

export default BlockedUsers;