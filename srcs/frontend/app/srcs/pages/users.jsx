import ftReact			from "../ft_react";
import { apiClient }	from "../api/api_client";
import BarLayout 		from "../components/barlayout";
import {
	C_PROFILE_HEADER,
	C_PROFILE_USERNAME
}						from "../conf/content_en";
import Alert 			from "../components/alert";
import Avatar 			from "../components/avatar";
import WebsocketClient from "../api/websocket_client";

const UserCard = (props) => {
	return (
		<div className="border rounded mb-2 d-flex" style={{border: "solid"}}>
			<button className="btn w-100" onClick={() => props.route(`/users/${props.data.id}`)}>
				<ul className="list-group list-group-flush">
					<li className="list-group-item d-inline-flex justify-content-start align-items-center gap-3" >
						<Avatar img={props.data.avatar} size={"40rem"}/>
						<span className="text-break">  {props.data.username}</span>
						{props.activeFriends.includes(props.data.id) && <span className="badge bg-success ms-auto">Online</span>}
					</li>
				</ul>
			</button>
		</div>
	);
}

let prevEventListener = null;
let prevOpenListener = null;
let ws = null;

const Users = (props) => {
	const [users, setUsers] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	const [skip, setSkip] = ftReact.useState(0);
	const [limit, setLimit] = ftReact.useState(10);
	const [activeFriends, setActiveFriends] = ftReact.useState([]);
	const [endOfUsers, setEndOfUsers] = ftReact.useState(false);
	ftReact.useEffect(async() => {
		const getUsers = async () => {
			const data = await apiClient.get("/users", {skip: skip, limit: limit});
			if (data.error)
				setError(data.error);
			else if (data && !users) {
				setUsers(data);
				setSkip(skip + limit);
			}
		}
		if (!users && !error)
			await getUsers();
	}, [users, setUsers]);
	ftReact.useEffect(() => {
		const handleOpen = () => {
			ws.send(JSON.stringify({type: "active.friends"}));
		}
		if (prevOpenListener)
			ws.removeEventListener('open', prevOpenListener);
		ws = new WebsocketClient("wss://api.localhost/ws/chat/dm/", localStorage.getItem("access_token")).getWs();
		if (ws && ws.readyState === WebSocket.OPEN)
			handleOpen();
		else {
			ws.addEventListener('open', handleOpen);
			prevOpenListener = handleOpen;
		}
		return () => {
			ws && prevOpenListener && ws.removeEventListener('open', prevOpenListener);
		};
	}, []);
	ftReact.useEffect(() => {
        const handleMessage = (ev) => {
            const data = JSON.parse(ev.data);
            if ("status" in data && data.status === 'active.friends') {
                setActiveFriends(data.active_friends_ids);
            }
            if ("type" in data && data.type === 'client.update') {
                setActiveFriends(data.active_friends_ids);
            }
			if ("type" in data && data.type === 'status.update') {
				if (data.status === "connected")
					setActiveFriends([...activeFriends, data.sender_id]);
				else if (data.status === "disconnected")
					setActiveFriends([...activeFriends.filter(id => id !== data.sender_id)]);
			}
        }
		if (ws) {
			if (prevEventListener)
				ws.removeEventListener('message', prevEventListener);
			ws.addEventListener('message', handleMessage);
			prevEventListener = handleMessage;
		}
		return () => {
			ws && ws.removeEventListener('message', prevEventListener);
		};
	}, [activeFriends, setActiveFriends]);
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
	return (
		<BarLayout route={props.route}>
			{
				users
					? 
						<div>
							{users.map(user => <UserCard data={user} route={props.route} user={user} activeFriends={activeFriends}/>)}
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