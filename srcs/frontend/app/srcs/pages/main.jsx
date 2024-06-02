import ftReact		from "../ft_react";
import BarLayout	from "../components/barlayout.jsx";
import {
	C_MAIN_HEADER,
	C_MAIN_LOGIN
}					from "../conf/content_en.js";
import GithubIcon from "../components/github_icon.jsx";
import Avatar from "../components/avatar.jsx";

const CreatorProfile = (props) => {
	return (
		<div
			className="card p-2 text-secondary align-items-center hover-zoom flex-grow-1"
			style={{opacity: "95%"}}
		>
			<img
				width="60px"
				style={{borderRadius: "100%"}}
				src={props.avatar}
				alt={`${props.name}'s avatar`}
			/>
			<h4>{props.name}</h4>
			<ul>
				{props.roles?.map(role => <li style={{textAlign: 'left'}}>{role}</li>)}
			</ul>
			<a
				className="text-secondary fw-light text-decoration-none nav-link mt-auto"
				href={props.github}
				target="_blank"
			>
				<GithubIcon/> Github
			</a>
		</div>
	);
};

let buf = null;

const Main = (props) => {
	const [mouseX, setMouseX] = ftReact.useState(window.innerWidth * 0.5);
	const [mouseY, setMouseY] = ftReact.useState(window.innerHeight * 0.2);
	ftReact.useEffect(()=>{
		const mousemove = (ev)=>{
			if (ev.clientY < (window.innerHeight - 35))
				setMouseY((ev.clientY - 30));
			if (ev.clientX < window.innerWidth - 35)
				setMouseX((ev.clientX - 30));
		};
		if (buf)
			document.removeEventListener('mousemove', buf);
		document.addEventListener('mousemove', mousemove);
		buf = mousemove
		return () => buf && document.removeEventListener('mousemove', buf);

	}, [mouseX, mouseY, setMouseX, setMouseY]);
	const calcY = (y) => {
		if (y < window.innerHeight / 5)
			return window.innerHeight / 5;
		if (y > window.innerHeight - (window.innerHeight / 5))
			return window.innerHeight - (window.innerHeight / 5);
		return y;
	}
	return (
		<BarLayout route={props.route}>
			<div className="h-100 py-5 w-100 d-flex flex-column align-items-center" style={{cursor: 'none'}}>
				<h1
					style={{opacity: '0', animation: 'fadeIn 0s forwards 0.5s'}}
					className="text-secondary"
				>42 TRANSCENDENCE</h1>
				<h2
					style={{opacity: '0', animation: 'fadeIn 1s forwards 1s'}}
					className="text-secondary"
				>ONLINE PONG GAME</h2>
				<p
					style={{opacity: '0', animation: 'fadeIn 1s forwards 2s', maxWidth: '48ch'}}
					className="text-secondary mt-5"
				>
					This is the final project of our core curriculum at the software development school 42 Wolfsburg. It is a full stack web application written in plain JavaScript and Django. 
					<br/><br/>The most unique element in our implementation of this excercise is a frontend framework modeled after React, called ft_react. Feel free to check the source code for that.
					<br/><br/>Please enjoy and contribute if you feel inspired.
				</p>
				<h3
					className="text-secondary mt-5"
					style={{opacity: '0', animation: 'fadeIn 1s forwards 2s'}}
				>
					The Creators
				</h3>
				<div
					style={{opacity: '0', animation: 'fadeIn 1s forwards 2s', padding: '0 22%'}}
					className="d-flex flex-row gap-2 flex-wrap flex-grow align-items-start justify-content-center"
				>
					<CreatorProfile
						name="psimonen"
						roles={["ft_react", "infrastructure"]}
						avatar="https://avatars.githubusercontent.com/u/36280649"
						github="https://github.com/rabarbra"
						/>
					<CreatorProfile
						name="valmpani"
						roles={["backend", "frontend", "cli", "infrastructure"]}
						avatar="https://avatars.githubusercontent.com/u/90504973"
						github="https://github.com/vasilisalmpanis"
						/>
					<CreatorProfile
						name="mtrautne"
						roles={["oauth2", "chats", "the logo"]}
						avatar="https://avatars.githubusercontent.com/u/47814311"
						github="https://github.com/Mowriez"
					/>
				</div>
				<a
					href="https://github.com/vasilisalmpanis/ft_transcendence"
					target="_blank"
					className="text-secondary text-decoration-none nav-link"
					style={{
						opacity: '0', animation: 'fadeIn 1s forwards 2s',
						marginTop: 'auto',
					}}
				>
					<GithubIcon/> Source Code
				</a>
			</div>
			<div
				style={{
					width: '60px',
					height: '60px',
					backgroundColor: 'yellow',
					borderRadius: '100%',
					position: 'absolute',
					top: mouseY + 'px',
					left: mouseX + 'px',
					zIndex: '-1',
					transition: 'all 0.1s 0s',
					filter: 'drop-shadow(0px 0px 30px yellow)',
					opacity: '0',
					animation: 'fadeIn 1s forwards 2s, sizeChange 2s infinite',
					cursor: 'none'
				}}
			></div>
			<button
				className="btn btn-outline-primary"
				style={{
					width: window.innerHeight * 0.2 + 'px',
					transform: 'rotate(0.25turn)',
					position: 'absolute',
					zIndex: '1',
					left: '0%',
					opacity: '0',
					animation: 'fadeIn 1s forwards 2s',
					top: calcY(mouseY) + 'px',
					transition: 'all 1s',
				}}
				onClick={() => props.route("/local-game")}
			>
				{"Play Pong game"}
			</button>
			<button
				className="btn btn-outline-primary"
				style={{
					width: window.innerHeight * 0.2 + 'px',
					transform: 'rotate(0.25turn)',
					position: 'absolute',
					zIndex: '1',
					right: '0%',
					opacity: '0',
					animation: 'fadeIn 1s forwards 2s',
					top: calcY(mouseY) + 'px',
					transition: 'all 1s',
				}}
				onClick={() => props.route("/local-tournament")}
			>
				{"Start tournament"}
			</button>
		</BarLayout>
	);
};

export default Main;