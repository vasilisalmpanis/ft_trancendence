	import ftReact			from "../ft_react";
	import { apiClient }	from "../api/api_client";
	import BarLayout 		from "../components/barlayout";
	import {
		C_PROFILE_HEADER,
		C_PROFILE_USERNAME
	}						from "../conf/content_en";
	import Alert from "../components/alert";
	import Avatar from "../components/avatar";

	const UserCard = (props) => {
		return (
			<div className="border rounded mb-2 d-flex" style={{border: "solid"}}>
				<button className="btn" onClick={() => props.route(`/users/${props.data.id}`)}>
					<ul className="list-group list-group-flush">
						<li className="list-group-item d-inline-flex justify-content-start align-items-center gap-3 text-wrap">
							<Avatar img={props.data.avatar} size={"10%"}/>
							<span className="text-wrap">  {props.data.username}</span>
						</li>
					</ul>
				</button>
			</div>
		);
	}

	const Users = (props) => {
		const [users, setUsers] = ftReact.useState(null);
		const [error, setError] = ftReact.useState("");
		const [skip, setSkip] = ftReact.useState(0);
		const [limit, setLimit] = ftReact.useState(10);
		const [endOfUsers, setEndOfUsers] = ftReact.useState(false);
		const getUsers = async () => {
			const data = await apiClient.get("/users", {skip: skip, limit: limit});
			if (data.error)
				setError(data.error);
			else if (data && !users) {
				setUsers(data);
				setSkip(skip + limit);
			}
		};
		const loadMore = async () => {
			const data = await apiClient.get("/users", {skip: skip, limit: limit});
			if (data.error)
				setError(data.error);
			else if (data) {
				if (data.length < limit) {
					setEndOfUsers(true);
				}
				setUsers(users.concat(data));
				setSkip(skip + limit);
			}
		};
		if (!users && !error)
			getUsers();
		return (
			<BarLayout route={props.route}>
				{
					users
						? 
							<div className="w-50">
								{users.map(user => <UserCard data={user} route={props.route} user={user}/>)}
								{!endOfUsers && users && users.length % limit === 0 && 
									<button className="btn btn-primary" onClick={() => loadMore()}>Load more</button>
								}
							</div>
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

	export default Users;