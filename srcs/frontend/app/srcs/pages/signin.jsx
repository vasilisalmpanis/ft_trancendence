import ftReact			from "../ft_react/index.js";
import { apiClient }	from "../api/api_client.js";
import Layout			from "../components/layout.jsx";
import {
	C_SIGNIN_BUTTON,
	C_SIGNIN_HEADER,
	C_SIGNIN_INTRA,
	C_SIGNIN_INTRA_ENDPOINT,
	C_SIGNIN_PASS,
	C_SIGNIN_SIGNUP,
	C_SIGNIN_USERNAME
}						from "../conf/content_en.js";
import Alert from "../components/alert.jsx";


const Signin = (props) => {
	const [error, setError] = ftReact.useState("");
	const [username, setUsername] = ftReact.useState("");
	const [password, setPassword] = ftReact.useState("");
	const [submit, setSubmit] = ftReact.useState(false);
	if (location.search.length) {
		const handleQuery = async () => {
			let queryDict = new URLSearchParams(location.search);
			if (queryDict.has("access_token")) {
				const res = await apiClient.authorize({
					access_token: queryDict.get("access_token"),
					refresh_token: queryDict.get("refresh_token")
				});
				if (res.error)
					setError(res.error);
				else {
					queryDict.delete("access_token");
					queryDict.delete("refresh_token");
					if (res["ok"] === "true")
						props.route("/");
					else if (res["ok"] === "2fa")
						props.route("/2fa");
				}
			}
		}
		handleQuery();
	}
	ftReact.useEffect(async () => {
		const doSubmit = async () => {
			const resp = await apiClient.authorize({
				username: username,
				password: password
			});
			if (resp) {
				if (resp.error)
					setError(resp.error);
				else if (resp["ok"] === "true")
					props.route("/");
				else if (resp["ok"] === "2fa")
				{
					props.route("/2fa");
					// localStorage.setItem("2fa", true);
				}
			}
		};
		if (submit) {
			setSubmit(false);
			await doSubmit();
		}
	}, [submit, setSubmit, username, password, setError]);
	return (
		<Layout>
			<div>
				<h1>{C_SIGNIN_HEADER}</h1>
				<form
					onSubmit={(event)=>{
						event.preventDefault();
						setSubmit(true)
					}}
					className="mt-3"
				>
					<div className="mb-3">
						<input
							placeholder={C_SIGNIN_USERNAME}
							className="form-control"
							onChange={(e) => setUsername(e.target.value)}
							required
							autoFocus
						/>
					</div>
					<div className="mb-3">
						<input
							placeholder={C_SIGNIN_PASS}
							onChange={(e) => setPassword(e.target.value)}
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
					{error &&
						<div className="alert alert-danger d-flex align-items-center justify-content-center" role="alert">
							{/* <svg xmlns="http://www.w3.org/2000/svg" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Warning:">
								<path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
							</svg> */}
							<div>
								{error}
							</div>
						</div> 
					}
				</form>
				<div className="mb-3 mt-5">
					<button
						type="submit"
						className="btn btn-outline-primary w-100"
						onClick={()=>props.route("/signup")}
					>
						{C_SIGNIN_SIGNUP}
					</button>
				</div>
				<div className="mb-3">
					<a
						type="submit"
						className="btn btn-outline-primary w-100"
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
