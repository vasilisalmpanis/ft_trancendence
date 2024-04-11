import ftReact		from "../ft_react";
import Layout from "./layout";

const NavBar = (props) => {
	return (
		<nav className="navbar bg-body-tertiary">
			<div className="container-fluid">
				<div>
					<button
						onClick={() => props.route("/")}
						className="btn btn-outline-secondary me-3"
					>
						PONG 42
					</button>
					<button
						onClick={() => props.route("/leaderboard")}
						className="btn me-3"
					>
						{window.location.pathname === "/leaderboard" ? 
							<b>Leaderboard</b>
							: "Leaderboard"}
					</button>
					<button
						onClick={() => props.route("/games")}
						className="btn me-3"
					>
						{window.location.pathname === "/games" ? 
							<b>Games</b>
							: "Games"}
					</button>
					<button
						onClick={() => props.route("/users")}
						className="btn me-3"
					>
						{window.location.pathname === "/users" ? 
							<b>Users</b>
							: "Users"}
					</button>
				</div>
				<div className="d-flex flex-row align-items-center mr-2">
					<form class="form-inline ms-auto me-3">
						<input class="form-control ms-auto" type="search" placeholder="Search" aria-label="Search"/>
					</form>
							<button
								onClick={() => props.route("/me")}
								className="rounded-circle btn me-3 ms-auto"
							>
								<img
									src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"						
									alt="profile"
									width="30"
								></img>
							</button>
					{/* <h5 className="mx-auto">{props.me.username}</h5> */}
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
				{/* <Avatar img={me.avatar} size="50px"/>	 */}
				<Layout>
					{props.children}
				</Layout>
			</div>
	);
}
export default BarLayout; 
