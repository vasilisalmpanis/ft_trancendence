import { apiClient }	from "../api/api_client";
import ftReact			from "../ft_react";
import WebsocketClient	from "../api/websocket_client";


const NavBar = (props) => {
	const [collapse, setCollapse] = ftReact.useState(true);
	const [wsClient, setWsClient] = ftReact.useState(
		new WebsocketClient(
			"wss://api.localhost/ws/chat/dm/",
			localStorage.getItem("access_token")
		)
	);
    ftReact.useEffect(() => {
        wsClient && wsClient.getWs().addEventListener('message', ev => {
            const data = JSON.parse(ev.data);
            if ("content" in data || 'status' in data) {
				console.log(data);
            };
        });
		return () => {
			console.log("closing ws");
			wsClient && wsClient.close();
			setWsClient(null);
		}
    }, [wsClient, setWsClient]);
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
								<sup class="badge rounded-pill bg-success align-top">
									<small>
										235
										<span class="visually-hidden">unread messages</span>
									</small>
								</sup>
							</a>
						</li>
						</ul>
							<div className="d-flex align-items-center">
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
									<img
										src={props.me.avatar.replace("data", "data:").replace("base64", ";base64,")}
										style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}					
										alt="profile"
										width="30"
									></img>
								</button>
							</div>
					</div>
				: 	<a
						onClick={() => {
							props.route("/signin");
						}}
						className="nav-link"
						style={{cursor: "pointer"}}
					>Sign In</a>
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
