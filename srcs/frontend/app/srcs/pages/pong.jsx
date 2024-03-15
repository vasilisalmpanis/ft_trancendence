import ftReact	from "../ft_react";
import Layout 	from "../components/layout";
import BarLayout from "../components/barlayout";

const Score = (props) => (
	<div style={{
		marginTop: "10px",
		textAlign: "center",
	}}>
		<span>{`${props.score.s1} : ${props.score.s1}`}</span>
	</div>
);

const Platform = (props) => {
	const style = {
		width: "10px",
		height: "20%",
		backgroundColor: "royalblue",
		position: "absolute",
		top: `${props.y}%`,
	};
	if (props.right)
		style.right = "1%";
	else
		style.left = "1%";
	return (
		<div style={style}/>
	)
}


const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
const Pong = (props) => {
	const [ball, setBall] = ftReact.useState({x: 50, y: 50});
	const [score, setScore] = ftReact.useState({s1: 0, s2: 0});
	const [pl, setPl] = ftReact.useState(40);
	const [pr, setPr] = ftReact.useState(40);
	let me = 'left';
	ws.addEventListener('message', ev => {
        const data = JSON.parse(ev.data);
        if (data.start)
        {
            console.log(data.start);
            return ;
        }
        if (data.side === 'right')
		{
            me = 'right';
			return ;
		}
		setBall({x: data.x, y: data.y});
        if ('p1' in data)
            setPl(data.p1);
        if ('p2' in data)
            setPr(data.p2);
        if ('s1' in data)
			setScore({s1: data.s1, s2: data.s2});
	})
	let platformDirection = '';
	const keyPress = (ev) => {
		switch (ev.key) {
			case 'ArrowUp':
				ws.send(JSON.stringify({"message": "up", "d": me}));
				platformDirection = "up";
				break;
			case 'ArrowDown':
				ws.send(JSON.stringify({"message": "down", "d": me}));
				platformDirection = "down";
			break;
		}
	};
	const keyRelease = (event) => {
		if (event.key === 'ArrowUp' && platformDirection === 'up')
		{
			ws.send(JSON.stringify({"message": "stop", "d": me}));
			platformDirection = '';
		}
		else if (event.key === 'ArrowDown' && platformDirection === 'down')
		{
			ws.send(JSON.stringify({"message": "stop", "d": me}));
			platformDirection = '';
		}
	};
	document.addEventListener('keydown', keyPress);
    document.addEventListener('keyup', keyRelease);
	return (
		<BarLayout>
			<div style={{
				border: "2px solid rgb(248, 2, 191)",
				borderRadius: "1%",
				boxShadow: "0 0 50px rgba(248, 2, 191, 0.5)",
				padding: 0,
				width: "95%",
				height: "95%",
				position: "relative",
			}}>
				<Score score={score}/>
				<div style={{
					height: "2%",
					aspectRatio: "1/1",
					backgroundColor: "rgb(216, 223, 24)",
					borderRadius: "100%",
					position: "absolute",
					left: `${ball.x - 1}%`,
					top: `${ball.y - 1}%`,
				}}/>
				<Platform y={pl}/>
				<Platform right y={pr}/>
			</div>
		</BarLayout>
	);
};

export default Pong;