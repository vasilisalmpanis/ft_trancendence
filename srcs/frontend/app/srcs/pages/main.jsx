import ftReact		from "../ft_react";
import BarLayout	from "../components/barlayout.jsx";

const Main = (props) => {
	return (
		<BarLayout route={props.route}>
			<div className="mb-3">
				<h1>Main page</h1>
			</div>
			<div className="mb-3">
				<button
					className="btn btn-primary w-100"
					onClick={()=>props.route("/signin")}
				>
					Go to login
				</button>
			</div>
		</BarLayout>
	);
};

export default Main;