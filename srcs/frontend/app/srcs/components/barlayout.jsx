import ftReact		from "../ft_react";
import Layout from "./layout";
import Avatar from './avatar'


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
							<b className="border-bottom">Leaderboard</b>
							: "Leaderboard"}
					</button>
					<button
						onClick={() => props.route("/games")}
						className="btn me-3"
					>
						{window.location.pathname === "/games" ? 
							<b className="border-bottom">Games</b>
							: "Games"}
					</button>
					<button
						onClick={() => props.route("/tournaments")}
						className="btn me-3"
					>
						{window.location.pathname === "/tournaments" ? 
							<b className="border-bottom">Tournaments</b>
							: "Tournaments"}
					</button>
					<button
						onClick={() => props.route("/users")}
						className="btn me-3"
					>
						{window.location.pathname === "/users" ? 
							<b className="border-bottom">Users</b>
							: "Users"}
					</button>
				</div>
				<div className="d-flex flex-row align-items-center mr-2">
					<form class="form-inline ms-auto me-3">
						<input class="form-control ms-auto" type="search" placeholder="Search" aria-label="Search"/>
					</form>
							{props.me && <button
								onClick={() => props.route("/me")}
								className="rounded-circle btn me-3 ms-auto"
							>
								<img
									src={props.me.avatar.replace("data", "data:").replace("base64", ";base64,")}
									style={{objectFit: 'cover', borderRadius: '100%', aspectRatio: '1 / 1'}}					
									alt="profile"
									width="30"
								></img>
							</button>}

					{/* <Avatar img={props.me.avatar} size="50px"/> */}
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
				{/* <Avatar img={me.avatar}/>	 */}
				<Layout>
					{props.children}
				</Layout>
			</div>
	);
}
export default BarLayout; 
