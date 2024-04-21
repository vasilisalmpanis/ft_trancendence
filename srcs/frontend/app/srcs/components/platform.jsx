import ftReact from "../ft_react";

const Platform = (props) => {
	const style = {
		width: "10px",
		height: "20%",
		backgroundColor: "royalblue",
		position: "absolute",
		top: `${props.y}%`,
	};
	let id = "pl-left";
	if (props.right) {
		id = "pl-right";
		style.right = "1%";
	} else
		style.left = "1%";
	return (
		<div id={id} style={style}/>
	);
}

export default Platform;