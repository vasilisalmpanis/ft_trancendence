import ftReact		from "../ft_react";
import BarLayout	from "../components/barlayout.jsx";
import {
	C_MAIN_HEADER,
	C_MAIN_LOGIN
}					from "../conf/content_en.js";

const Main = (props) => {
	return (
		<BarLayout route={props.route}>
			<div className="mb-3 w-25">
				<div className="mb-3">
					<h1>{C_MAIN_HEADER}</h1>
				</div>
				<div className="mb-3">
					<button className="btn btn-primary" onClick={() => props.route("/signin")}>{C_MAIN_LOGIN}</button>
				</div>
			</div>
		</BarLayout>
	);
};

export default Main;