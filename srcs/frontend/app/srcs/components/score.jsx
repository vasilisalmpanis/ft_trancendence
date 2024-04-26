import ftReact from "../ft_react";

const Score = (props) => (
	<div style={{
		marginTop: "10px",
		textAlign: "center",
	}}>
		<span id="score-board">{`${props.score.s1} : ${props.score.s2}`}</span>
	</div>
);

export default Score;