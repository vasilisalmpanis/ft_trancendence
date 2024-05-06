import ftReact									from "../ft_react";
import { apiClient }							from "../api/api_client";
import {
	C_PROFILE_HEADER,
	C_PROFILE_USERNAME
}												from "../conf/content_en";
import BarLayout								from "../components/barlayout";
import Alert									from "../components/alert";
import Avatar									from "../components/avatar";
import EditIcon									from "../components/edit_icon";
import ClipboardIcon							from "../components/clipboard_icon";
import StatsLayout								from "../components/statslayout";


const BlockedUsers = (props) => {
	const unblockUser = async (user_id) => {
		const data = await apiClient.put(`/block`, {user_id: user_id});
		if (data.error)
			return ;
		else
			props.setter(null);
	}
	return (
		<div className="d-flex flex-column align-self-stretch">
			<div className="card" style="width: 20rem;">
				<ul className="list-group list-group-flush">
					<li className="list-group-item">
						<h5 className="card-title">Blocked Users</h5>
					</li>
					{
						// error ?
						// 	<span>{error}</span>
						// :
							(props.users && props.users.length)
								?
								props.users.map((user) => {
									return (
										<li className="list-group-item d-flex justify-content-between align-items-center">
											<Avatar img={user.avatar} size="50px"/>
											<span className="">{user.username}</span>
											<button className="btn btn-primary" onClick={() => unblockUser(user.id)}>Unblock</button>
										</li>
								)}
								)
								:
								<span>No blocked users</span>
					}
				</ul>
			</div>
		</div>
	)
}

const ProfileCard = (props) => {
	const [img, setImg] = ftReact.useState(props.data.avatar);
	const [tfa, setTfa] = ftReact.useState("");
	const [error, setError] = ftReact.useState("");
	const [tfaEnabled, setTfaEnabled] = ftReact.useState(localStorage.getItem('2fa') === 'true');
	const updateMe = async () => {
		if (img && img instanceof Blob) {
			const reader = new FileReader();
    		reader.onload = async function(readerEvent) {
				const base64 = readerEvent.target.result;
				const resp = await apiClient.post("/users/me", {"avatar": base64});
				if (resp.error)
					setError(resp.error);
				else
					localStorage.setItem("me", JSON.stringify(resp));
    		};
			reader.readAsDataURL(img);
		}
	}
	return (
		<div className="justify-content-center" style="width: 18rem;">
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
						<h5 className="">{props.data.username}</h5>
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
				{/* <li className="list-group-item">{C_PROFILE_USERNAME}: {props.data.username}</li> */}
				<li className="list-group-item">
					{
						tfaEnabled
							? <button
								className="btn btn-outline-primary w-100"
								onClick={
									async ()=>{
										const res = await apiClient.delete("/2fa");
										if (res.error)
											setError(res.error)
										else
										{
											localStorage.setItem("2fa", false);
											setTfaEnabled(false);
										}
									}
								}
							>
								Disable 2FA
							</button>
							: <button
								data-bs-toggle="modal"
								data-bs-target="#exampleModal"
								className="btn btn-outline-primary w-100"
								onClick={
									async ()=>{
										const res = await apiClient.post("/2fa");
										if (res.error)
											setError(res.error);
										else if (res.secret) {
											setTfa(res.secret);
										}
									}
								}
							>
								Enable 2FA
							</button>
					}
				</li>
				{error && <Alert msg={error}/>}
			</ul>
			<div
				className="modal fade"
				id="exampleModal"
				tabindex="-1"
				aria-labelledby="exampleModalLabel"
				aria-hidden="true"
			>
  				<div class="modal-dialog modal-dialog-centered">
  					<div className="modal-content">
  						<div className="modal-body">
  							<h3
								className="modal-title fs-5"
								id="exampleModalLabel"
							>
									Add this secret to your authenticator app:
							</h3>
							<button
								type="button"
								className="f-inline-flex align-items-center btn btn-link text-decoration-none"
								onClick={()=>{navigator.clipboard.writeText(tfa)}}
							>
								<span className="me-1 mb-1">{tfa}</span>
								<ClipboardIcon/>
							</button>
							<form
								onSubmit={async (ev)=>{
									ev.preventDefault();
									const code = ev.target[0].value;
									const res = await apiClient.post("/2fa/verify", {"2fa_code": code});
									// console.log('RESPONSE AFTER EVDERYTHING:', res);
									if (res.status === '2FA Verified')
									{
										apiClient.authorize(res, null, true);
										// localStorage.setItem("2fa", true);
										setTfaEnabled(true);
									}
									else if (res.error)
										setError(res.error);
								}}
								className="d-flex flex-row gap-3 my-3"
							>
								<input
									placeholder={"Code from authenticator app"}
									className="form-control"
									type="number"
									max={999999}
									required
								/>
								<button type="submit" className="btn btn-outline-primary">OK</button>
							</form>
							{error && <Alert msg={error}/>}
  						</div>
  					</div>
  				</div>
			</div>
		</div>
	);
}

const IncomingRequests = (props) => {
	return (
		<div className="d-flex flex-column align-self-stretch">
			<div className="card" style="width: 20rem;">
				<ul className="list-group list-group-flush">
					<li className="list-group-item">
						<h5 className="card-title">Friend Requests</h5>
					</li>
					{
						props.requests && props.requests.length
						?
						props.requests.map((request, i) => {
							return (
								<FriendRequestLayout request={request} i={i} setter={props.setter} data={props.requests} sent={props.sent}/>
							);
						})
						: <span>You have no pending requests</span>
					}
				</ul>
			</div>
		</div>
	);

}

const FriendRequestLayout = (props) => {
	const acceptRequest = async () => {
		const data = await apiClient.post(`/friendrequests/accept`, {request_id: props.request.id});
		if (data.error)
			return ;
		else {
			props.setter(null);
		}
	};
	const declineRequest = async () => {
		const data = await apiClient.post(`/friendrequests/decline`, {request_id: props.request.id});
		if (data.error)
			return ;
		else {
			props.setter(null);
		}
	};
	const canceRequest = async () => {
		const data = await apiClient.put(`/friendrequests`, {request_id: props.request.id});
		if (data.error)
			return ;
		else {
			props.setter(null);
		}
	};
	return (
		<li className="list-group-item d-flex">
				{props.sent
				?
				<div className=" w-100 d-flex flex-row justify-content-between">
					<h5 className="">{props.request.sender.username}</h5>
					<button className="btn btn-danger" onClick={canceRequest}>Cancel</button>
				</div>				
				:
				<div className="d-flex flex-row  my-2 my-lg-0">
					<h5>From:</h5>
					<h5 className="">{props.request.sender.username}</h5>
					<button className="btn mx-auto" onClick={acceptRequest}>Accept</button>
					<button className="btn mx-auto" onClick={declineRequest}>Decline</button>
				</div>
			}
		</li>
	)
}

const Profile = (props) => {
	const me = JSON.parse(localStorage.getItem("me"));
	const [blockedUsers, setBlockedUsers] = ftReact.useState(null);
	const [incomingRequests, setIncomingRequests] = ftReact.useState(null);
	const [outgoingRequests, setOutgoingRequests] = ftReact.useState(null);
	const [stats, setStats] = ftReact.useState(null);
	const [error, setError] = ftReact.useState("");
	ftReact.useEffect(async () => {
		const getMyStats = async () => {
			const data = await apiClient.get(`/users/${me.id}/stats`);
			if (data.error)
				setError(data.error);
			else if (data && !stats)
				setStats(data);
		}
		if (!stats && !error)
			await getMyStats();
	},[stats]);
	ftReact.useEffect(async () => {
		const getBlockedUsers = async () => {
			let data = await apiClient.get(`/block`, {limit: 10, skip: 0});
			if (data.error)
				setError(data.error);
			else if (data && data.length)
				setBlockedUsers([...data]);
			else if (data.status === 'No blocked users')
				setBlockedUsers([]);
		}
		if (!blockedUsers && !error)
			await getBlockedUsers();
	}
	,[blockedUsers]);
	ftReact.useEffect(async () => {
		const getIncomingRequests = async () => {
			const data = await apiClient.get(`/friendrequests/incoming`, {limit: 10, skip: 0});
			if (data.error)
				setError(data.error);
			else if (data && data.length)
				setIncomingRequests([...data]);
		}
		if (!incomingRequests && !error)
			await getIncomingRequests();
	},[incomingRequests]);
	ftReact.useEffect(async () => {
		const getOutgoingRequests = async () => {
			const data = await apiClient.get(`/friendrequests`, {limit: 10, skip: 0});
			if (data.error)
				setError(data.error);
			else if (data && data.length)
				setOutgoingRequests([...data]);
		}
		if (!outgoingRequests && !error)
			await getOutgoingRequests();
	},[outgoingRequests]);
	return (
		<BarLayout route={props.route}>
			{
				me
					? 	<div className="d-grid">
							<div className="row border rounded justify-content-center text-center mb-3" style={{borderStyle: "solid"}}>
								<div className="col d-flex justify-content-center">
									<ProfileCard data={me}/>
								</div>
								<div className="col d-flex align-items-center">
									{stats && <StatsLayout stats={stats}/>}
								</div>
							</div>
							{/* {(incomingRequests || outgoingRequests || blockedUsers) 
							&& <div className="row">
									<div className="col-lg-4 d-flex justify-content-end mt-2">
										{incomingRequests && incomingRequests.length > 0 && 
											<button
												className="btn"
												onClick={() => {props.route("/friendrequests/incoming")}}
											>
													See all
											</button>
										}
									</div>
									<div className="col-lg-4 d-flex justify-content-end mt-2">
									{outgoingRequests && outgoingRequests.length > 0 && 
											<button
												className="btn"
												onClick={() => {props.route("/friendrequests/outgoing")}}
											>
													See all
											</button>
									}
									</div>
									<div className="col-lg-4 d-flex justify-content-end mt-2">
									{blockedUsers && blockedUsers.length > 0 && 
											<button
												className="btn"
												onClick={() => {props.route("/blocked")}}
											>
													See all
											</button>
									}
									</div>
								</div>
							} */}
							{error 
							? 
							<Alert msg={error}/>
							:
								!incomingRequests && !outgoingRequests && !blockedUsers
								?
									<button className="spinner-grow" role="status"></button>
								:
								<div className="row align-items-end">
									<div className="col-lg-4 d-flex align-items-end mt-2">
										{incomingRequests && incomingRequests.length > 0 && 
												<button
													className="btn"
													onClick={() => {props.route("/friendrequests/incoming")}}
												>
														See all
												</button>
											}
										<IncomingRequests requests={incomingRequests} setter={setIncomingRequests} sent={false}/>
									</div>
									<div className="col-lg-4 d-flex flex-column align-items-end mt-2">
										{outgoingRequests && outgoingRequests.length > 0 && 
												<button
													className="btn"
													onClick={() => {props.route("/friendrequests/sent")}}
												>
														See all
												</button>
											}
										<OutgoingRequests requests={outgoingRequests} setter={setOutgoingRequests} sent={true}/>
									</div>
									{blockedUsers && 
										<div className="col-lg-4 d-flex flex-column align-items-end mt-2">
										{blockedUsers && blockedUsers.length > 0 && 
												<button
													className="btn"
													onClick={() => {props.route("/blocked")}}
												>
														See all
												</button>
											}											
											<BlockedUsers users={blockedUsers} setter={setBlockedUsers}/>
										</div>
									}
									</div>
							}
						</div>
					:
						<button className="spinner-grow" role="status"></button>
			}
		</BarLayout>
	);
}

const OutgoingRequests = (props) => {
	return (
		<div className="d-flex flex-column align-self-stretch">
			<div className="card" style="width: 20rem;">
				<ul className="list-group list-group-flush">
					<li className="list-group-item">
						<h5 className="card-title">Sent Requests</h5>
					</li>
					{
						props.requests && props.requests.length
						?
						props.requests.map((request, i) => {
							return (
								<FriendRequestLayout request={request} i={i} setter={props.setter} data={props.requests} sent={props.sent}/>
							);
						})
						: <span>You sent no friend requests</span>
					}
				</ul>
			</div>
		</div>
	);
}
export default Profile;