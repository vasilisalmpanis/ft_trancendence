import { apiClient }	from "../api/api_client";
import ftReact			from "../ft_react";
import WebsocketClient	from "../api/websocket_client";
import Avatar           from "./avatar";
import Logo from "./logo";
// import Layout 	from "./layout";

let prevEventListener = null;

const NavBar = (props) => {
	const [collapse, setCollapse] = ftReact.useState(true);
	const [unread, setUnread] = ftReact.useState(null);
	const me = JSON.parse(localStorage.getItem("me"));
	const [invite, setInvite] = ftReact.useState(null);
	const [bellOpen, setBellOpen] = ftReact.useState(false);
	const [wsClient, setWsClient] = ftReact.useState( me ?
		new WebsocketClient(
			"wss://api.localhost/ws/chat/dm/",
			localStorage.getItem("access_token")
		) : null
	);
	ftReact.useEffect(() => {
		if (!wsClient)
			return ;
		const newMessage = (ev) => {
			const data = JSON.parse(ev.data);
			if ('status' in data && data.status === "message.management" || data.status === "client connected") {
				setUnread(data.total_unread_messages);
				if ('game_invite' in data) {
					let invite = data.game_invite;
					if (invite !== null && invite.sender_id != me.id)
						setInvite(invite);
				}
			}
			if ('status' in data && data.status === "game.invite") {
				setInvite({sender_name: data.sender_name, chat_id: data.chat_id, sender_id: data.sender_id});
			}
			if ('status' in data && data.status === "game.invite.accepted")
				props.route(`/reroute?path=games`);
			if ('type' in data ) 
			{
				if (data.type === "plain.message" && data.message.sender.id !== me.id) {
					if (unread)
						setUnread(unread + 1);
					else
						setUnread(1);
				}
				else if (data.type === "unread.messages") {
					setUnread(data.total_unread_messages);
					if (data.game_invite != null && data.game_invite.sender_id != me.id)
						setInvite(data.game_invite)
				}
			}
		}
		if (prevEventListener)
			wsClient.getWs().removeEventListener('message', prevEventListener);
		wsClient && wsClient.getWs().addEventListener('message', newMessage);
		prevEventListener = newMessage;
		return () => {
		};
	}, [unread, setUnread]);
	ftReact.useEffect(() => {
		if (wsClient) {
			const ws = wsClient.getWs();
			if (ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({type: "unread.messages"}));
			}
			else {
				ws.addEventListener('open', () => {
					ws.send(JSON.stringify({type: "unread.messages"}));
				});
			}
		}
	}, []);
	return (
		<nav className="navbar navbar-expand-md bg-body-tertiary">
			<div className="container-fluid">
				<button
					onClick={() => props.route("/")}
					className="btn btn-outline-primary ms-2 navbar-brand text-primary"
				>
					<Logo/>
				</button>
				{props.me &&
					<button
						className="navbar-toggler me-2"
						type="button"
						onClick={(ev)=>{
							ev.preventDefault();
							setCollapse(!collapse)
						}}
					>
	  					<span className="navbar-toggler-icon"></span>
					</button>
				}
				{props.me
				? 	<div
						className={collapse ? "collapse navbar-collapse" : "collapse navbar-collapse show"}
						>
						<ul className="navbar-nav me-auto mb-2 mb-lg-0">
							<li className="nav-item">
								<a
									onClick={() => props.route("/leaderboard")}
									className="nav-link"
									style={{cursor: "pointer"}}
								>
									{window.location.pathname === "/leaderboard" ? 
										<b className="border-bottom">Leaderboard</b>
										: "Leaderboard"}
								</a>
							</li>
							<li className="nav-item">
								<a
									onClick={() => props.route("/games")}
									className="nav-link"
									style={{cursor: "pointer"}}
								>
									{window.location.pathname === "/games" ? 
										<b className="border-bottom">Games</b>
										: "Games"}
								</a>	
							</li>
							<li className="nav-item">
								<a
									onClick={() => props.route("/tournaments")}
									className="nav-link"
									style={{cursor: "pointer"}}
								>
									{window.location.pathname === "/tournaments" ? 
										<b className="border-bottom">Tournaments</b>
										: "Tournaments"}
								</a>
							</li>
							<li className="nav-item">
								<a
									onClick={() => props.route("/users")}
									className="nav-link"
									style={{cursor: "pointer"}}
								>
									{window.location.pathname === "/users" ? 
										<b className="border-bottom">Users</b>
										: "Users"}
								</a>
							</li>
							<li className="nav-item">
							<a
								onClick={() => props.route("/chats")}
								className="nav-link"
								style={{cursor: "pointer"}}
							>
								{window.location.pathname === "/chats" ? 
									<b className="border-bottom">Chats</b>
									: "Chats"}
								{	unread 		&&
									unread > 0	&&
									<sup class="badge rounded-pill bg-success align-top">
										<small>
											{unread > 99 ? "99+" : unread}
											<span class="visually-hidden">unread messages</span>
										</small>
									</sup>
								}
							</a>
						</li>
						</ul>
							<div className="d-flex align-items-center">
								<button
									className="btn me-2"
									onClick={()=>setBellOpen(!bellOpen)}
									id="bell-invite"
								>
									<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16">
									<path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/>
									</svg>
									{invite &&
									<sup class="badge rounded-pill bg-success align-top">
										<small>
											1
											<span class="visually-hidden">unread messages</span>
										</small>
									</sup>
									}
								</button>
								<div
									className="border rounded bg-gray p-2"
									style={{
										display: bellOpen ? 'block' : 'none',
										position: 'absolute',
										transform: 'translate(0%, 80%)',
										zIndex: '10',
									}}
								>
									{invite 
										? <div>
										<h6>
											{invite.sender_name} wants to play pong
										</h6>
										<div className="d-flex flex-wrap gap-2 justify-content-center">
											<button
												className="btn btn-outline-success"
												onClick={async () => {
													const ws = wsClient.getWs();
													ws && ws.send(JSON.stringify({
														type: 'game.invite',
														action: 'accept',
														chat_id: invite.chat_id,
													}));
												}}
											>
												Accept
											</button>
											<button
												className="btn btn-outline-danger"
												onClick={async () => {
													const ws = wsClient.getWs();
													ws && ws.send(JSON.stringify({
														type: 'game.invite',
														action: 'decline',
														chat_id: invite.chat_id,
													}));
													setInvite(null);
													setBellOpen(false);
												}}
											>
												Decline
											</button>
										</div>

									</div>
										: 'No Notifications'
										
									}
								</div>
								<a
									onClick={() => {
										apiClient.logout();
										props.route("/signin");
									}}
									className="nav-link"
									style={{cursor: "pointer"}}
								>Sign Out</a>
								<button
									onClick={() => props.route("/me")}
									className="rounded-circle btn me-3 ms-auto"
								>
									<Avatar img={props.me.avatar} size={'45rem'}/>
								</button>
							</div>
					</div>
				: 	<a
						onClick={() => {
							props.route("/signin");
						}}
						className="nav-link"
						style={{cursor: "pointer"}}
					>
						Sign In
					</a>
			}
			</div>
		</nav>
	);
}



const BarLayout = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	return (
			<div className="h-100">
				<NavBar route={props.route} me={me}/>
				<div
					style={{maxWidth: "100vw"}}
					className="
					container-md
					text-center
					d-flex
					flex-column
					mb-3
					justify-content-center
					align-items-center
					p-3
					h-100
				">
					{props.children}
				</div>
			</div>
	);
}
export default BarLayout; 
