import ftReact		from "../ft_react/index.js";
import { apiClient }	from "../api/api_client.js";
import Layout		from "../components/layout.jsx";
import {
	C_SIGNIN_BUTTON,
	C_SIGNIN_HEADER,
	C_SIGNIN_INTRA,
	C_SIGNIN_INTRA_ENDPOINT,
	C_SIGNIN_PASS,
	C_SIGNIN_SIGNUP,
	C_SIGNIN_USERNAME
}					from "../conf/content_en.js";


const Signin = (props) => {
	if (location.search.length) {
		let queryDict = new URLSearchParams(location.search);
		if (queryDict.has("access_token")) {
			apiClient.authorize({
				access_token: queryDict.get("access_token"),
				refresh_token: queryDict.get("refresh_token")
			});
			queryDict.delete("access_token");
			queryDict.delete("refresh_token");
			props.route("/");
		}
	}
	const submit = (event) => {
		event.preventDefault();
		const username = event.target[0].value;
		const password = event.target[1].value;
		apiClient.authorize({username: username, password: password}).then(resp=>{
			resp && resp.ok ? props.route("/") : console.log(resp);
		});

	};
	return (
		<Layout>
			<div>
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
							className="btn btn-outline-primary w-100"
						>
							{C_SIGNIN_BUTTON}
						</button>
					</div>
				</form>
				<div className="mb-3">
					<button
						type="submit"
						className="btn btn-outline-secondary w-100"
						onClick={()=>props.route("/signup")}
					>
						{C_SIGNIN_SIGNUP}
					</button>
				</div>
				<div className="mb-3">
					<a
						type="submit"
						className="btn btn-primary w-100"
						href={C_SIGNIN_INTRA_ENDPOINT}
					>
						{C_SIGNIN_INTRA}
					</a>
				</div>
			</div>
		</Layout>
	);
};

export default Signin;