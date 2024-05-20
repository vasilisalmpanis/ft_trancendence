import { apiClient } from "../api/api_client";
import ftReact	from "../ft_react";
import Layout 	from "./layout";


const NavBar = (props) => {
	const [collapse, setCollapse] = ftReact.useState(true);
	return (
		<nav className="navbar navbar-expand-md bg-body-tertiary">
			<div className="container-fluid">
				<button
					onClick={() => props.route("/")}
					className="btn btn-outline-primary ms-2 navbar-brand text-primary"
				>
					PONG 42
				</button>
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
				<div
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
					</ul>
					{props.me && 
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
					}
				</div>
			</div>
		</nav>
	);
}



const BarLayout = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	return (
			<div className="h-100">
				<NavBar route={props.route} me={me}/>
				<div className="
					container-md
					text-center
					d-flex
					flex-column
					mb-3
					justify-content-center
					align-items-center
					p-1
					h-100
				">
					{props.children}
				</div>
			</div>
	);
}
export default BarLayout; 
