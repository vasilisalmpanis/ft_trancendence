import ftReact		from "../ft_react";
import Layout		from "../components/layout.jsx";

const Main = (props) => {
	return (
		<Layout>
			<div className="mb-3">
				<h1>Main page</h1>
			</div>
			<div className="mb-3">
				<button
					className="btn btn-primary w-100"
					onClick={()=>props.route("/login")}
				>
					Go to login
				</button>
			</div>
		</Layout>
	);
};

export default Main;