import ftReact		from "../ft_react";
import BarLayout	from "../components/barlayout";
import { apiClient }	from "../api/api_client";
import Alert		from "../components/alert";

const Incoming = (props) => {
    const [incomingFriendRequests, setIncomingFriendRequests] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    ftReact.useEffect(async () => {
	    const getSentFriendRequests = async () => {
		    const response = await apiClient.get("/friendrequests/incoming")
		    if (response.error) {
			    setError(response.error);
			    return;
		    } 
		    setIncomingFriendRequests(response);
	    }
	    if (!incomingFriendRequests) {
			await getSentFriendRequests();
	    }
    }, []);
    return (
        <BarLayout route={props.route}>
            {error ?
				<Alert type="danger" msg={error} />
				:
					(incomingFriendRequests && incomingFriendRequests.length > 0 )
					?
						<div>
							<h1>Incoming Friend Requests</h1>
						</div>
					:
						<div>
							<h1>No Incoming Friend Requests</h1>
						</div>
			}
        </BarLayout>
    );
};

export default Incoming;