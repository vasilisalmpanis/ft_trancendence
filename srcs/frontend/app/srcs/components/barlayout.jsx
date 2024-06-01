import { apiClient }	from "../api/api_client";
import ftReact			from "../ft_react";
import WebsocketClient	from "../api/websocket_client";
import Avatar from "./avatar";
// import Layout 	from "./layout";

let prevEventListener = null;

const NavBar = (props) => {
	const [collapse, setCollapse] = ftReact.useState(true);
	const [unread, setUnread] = ftReact.useState(null);
	const me = JSON.parse(localStorage.getItem("me"));
	const [invitations, setInvitations] = ftReact.useState([]);
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
				if ('chats_with_pending_game_invites' in data) {
					let invites = data.chats_with_pending_game_invites;
					if (Array.isArray(invites) && invites.length > 0)
						setInvitations(invites);
				}
			}
			if ('status' in data && data.status === "game.invite") {
				setInvitations([...invitations, {sender_name: data.sender_name, sender_id: data.sender_id, chat_id: data.chat_id}]);
			}
			if ('status' in data && data.status === "game.invite.accepted") {
				let game = data.game;
				console.log(game);
				props.route(`/games`);
			}
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
			// ws.addEventListener('close', (ev) => {
			// 	wsClient.close();
			// });
		}
	}, []);
	return (
		<nav className="navbar navbar-expand-md bg-body-tertiary">
			<div className="container-fluid">
				<button
					onClick={() => props.route("/")}
					className="btn btn-outline-primary ms-2 navbar-brand text-primary"
				>
					PONG 42
				</button>
				{props.me &&
					<button
						className="navbar-toggler me-2"
						type="button"
						// data-bs-toggle="collapse"
						// aria-expanded="false"
						// aria-label="Toggle navigation"
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
								{invitations.length > 0 &&
									<div className="badge rounded-pill bg-danger">
										{
											invitations.map((invitation) => {
												return (
													<div>
														<h6>
															{invitation.sender_name}
														</h6>
														<button
															className="btn"
															onClick={async () => {
																const ws = wsClient.getWs();
																ws && ws.send(JSON.stringify({
																	type: 'game.invite',
																	action: 'accept',
																	chat_id: invitation.chat_id,
																}));
															}}
														>
															Accept
														</button>
														<button
															className="btn"
															onClick={async () => {
																const ws = wsClient.getWs();
																ws && ws.send(JSON.stringify({
																	type: 'game.invite',
																	action: 'decline',
																	chat_id: invitation.chat_id,
																}));
																setInvitations(invitations.filter((inv) => inv.chat_id !== invitation.chat_id));
															}}
														>
															Decline
														</button>
													</div>
												)
											})
										}
									</div>
								}
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
