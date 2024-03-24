import ftReact		from "../ft_react/index.js";
import { apiClient }	from "../api/api_client.js";
import Layout		from "../components/layout.jsx";
import {
	C_SIGNIN_PASS,
	C_SIGNIN_USERNAME,
	C_SIGNUP_BUTTON,
	C_SIGNUP_EMAIL,
	C_SIGNUP_HEADER,
	C_SIGNUP_SIGNIN,
}					from "../conf/content_en.js";

const Signup = (props) => {
	const submit = (event) => {
		event.preventDefault();
		const username = event.target[0].value;
		const password = event.target[1].value;
		const email = event.target[2].value;
		apiClient.post("/users", {username: username, password: password, email: email}).then(resp=>{
			resp && resp.ok ? props.route("/signin") : console.log(resp);
		});

	};
	return (
		<Layout>
			<h1>{C_SIGNUP_HEADER}</h1>
			<form
				onSubmit={submit}
				className="mt-3"
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
					<input
						placeholder={C_SIGNUP_EMAIL}
						type="email"
						className="form-control"
						required
					/>
				</div>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-primary w-100"
					>
						{C_SIGNUP_BUTTON}
					</button>
				</div>
				<div className="mb-3 mt-5">
					<button
						type="submit"
						className="btn btn-outline-primary w-100"
						onClick={()=>props.route("/signin")}
					>
						{C_SIGNUP_SIGNIN}
					</button>
				</div>
			</form>
		</Layout>
	);
};

export default Signup;