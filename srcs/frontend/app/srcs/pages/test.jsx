import ftReact		from "../ft_react";
import Layout		from "../components/layout.jsx";

const Test = (props) => {
	return (
		<Layout>
			<div className="mb-3">
				<h1>Just a simple test page</h1>
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

export default Test;