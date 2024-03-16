import ftReact		from "../ft_react/index.js";
import ApiClient	from "../api/api_client.js";
import Layout		from "../components/layout.jsx";
import {
	C_SIGNIN_BUTTON,
	C_SIGNIN_HEADER,
	C_SIGNIN_PASS,
	C_SIGNIN_SIGNUP,
	C_SIGNIN_USERNAME
}					from "../conf/content_en.js";

const Signin = (props) => {
	const client = new ApiClient("http://localhost:8000");
	const submit = (event) => {
		event.preventDefault();
		const username = event.target[0].value;
		const password = event.target[1].value;
		client.authorize({username: username, password: password}).then(resp=>{
			resp && resp.ok ? props.route("/") : console.log(resp);
		});

	};
	return (
		<Layout>
			<h1>{C_SIGNIN_HEADER}</h1>
			<form
				onSubmit={submit}
			>
				<div className="mb-3">
					<input
						placeholder={C_SIGNIN_USERNAME}
						className="form-control"
						required
					/>
				</div>
				<div className="mb-3">
					<input
						placeholder={C_SIGNIN_PASS}
						type="password"
						className="form-control"
						required
					/>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
					>
						{C_SIGNIN_BUTTON}
					</button>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
						onClick={()=>props.route("/signup")}
					>
						{C_SIGNIN_SIGNUP}
					</button>
				</div>
			</form>
		</Layout>
	);
};

export default Signin;