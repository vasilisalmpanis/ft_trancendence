import ftReact		from "../ft_react";
import { apiClient } from "../api/api_client";
import BarLayout from "../components/barlayout";
import { C_PROFILE_HEADER, C_PROFILE_USERNAME } from "../conf/content_en";
import Alert from "../components/alert";
import DeleteIcon from "../components/delete_icon";
import EditIcon from "../components/edit_icon";
import Avatar from "../components/avatar";
import QR from "../qr";

const ProfileCard = (props) => {
	const [img, setImg] = ftReact.useState(props.data.avatar);
	const [tfa, setTfa] = ftReact.useState("");
	const updateMe = async () => {
		if (img && img instanceof Blob) {
			console.log("update");
			const reader = new FileReader();
    		reader.onload = async function(readerEvent) {
				const base64 = readerEvent.target.result;
				const resp = await apiClient.post("/users/me", {"avatar": base64});
				if (resp.error)
					console.log(error);
				else
					localStorage.setItem("me", JSON.stringify(resp));
    		};
			reader.readAsDataURL(img);
		}
	}
	return (
		<div className="card" style="width: 18rem;">
			<div className="card-body">
				<h5 className="card-title">{C_PROFILE_HEADER}</h5>
			</div>
			<ul className="list-group list-group-flush">
				<li className="list-group-item">
					<form
						onSubmit={(event)=>{
							event.preventDefault();
							updateMe();
						}}
						className="d-flex flex-column gap-3"
					>
						<div>
						<Avatar img={img}/>
						<span
							className="btn translate-middle rounded-pill position-absolute badge rounded-circle bg-primary"
							style={{
								overflow: "hidden",
								top: "75%",
								left: "75%",
							}}
						>
							<EditIcon/>
							<input
								style={{
									position: "absolute",
									top: 0,
									right: 0,
									minWidth: "100%",
									minHeight: "100%",
									filter: "alpha(opacity=0)",
									opacity: 0,
									outline: "none",
									cursor: "inherit",
									display: "block",
								}}
								className="input-control"
								type="file"
								id="imageInput"
								accept="image/*"
								onChange={(event)=>{
    								if (event.target.files[0]) {
										setImg(event.target.files[0]);
    								}
								}}
							/>
						</span>
						</div>
						<button type="submit" className="btn btn-outline-primary">Save</button>
					</form>
				</li>
				<li className="list-group-item">{C_PROFILE_USERNAME}: {props.data.username}</li>
				<li className="list-group-item">
					{
						localStorage.getItem('2fa') === 'true'
							? <button
								className="btn btn-outline-primary"
								onClick={
									async ()=>{
										const res = await apiClient.delete("/2fa");
										if (res.error)
											console.log(res)
										else
											localStorage.setItem("2fa", false)
									}
								}
							>
								Disable 2FA
							</button>
							: <button
								className="btn btn-outline-primary"
								onClick={
									async ()=>{
										//QR("HELLOWORLD");
										const res = await apiClient.post("/2fa");
										if (res.error)
											console.log(res);
										else if (res.secret) {
											console.log(res);
										}
									}
								}
							>
								Enable 2FA
							</button>
					}
				</li>
			</ul>
		</div>
	);
}

const Profile = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	const [error, setError] = ftReact.useState("");
	return (
		<BarLayout route={props.route}>
			{
				me
					? <ProfileCard data={me}/>
					: error
						? <Alert msg={error}/>
						: (
							<div className="spinner-grow" role="status">
								<span className="visually-hidden">Loading...</span>
				  			</div>
						)
			}
		</BarLayout>
	);
}

export default Profile;