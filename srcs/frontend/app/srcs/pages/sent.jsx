import ftReact		from "../ft_react";
import BarLayout	from "../components/barlayout";
import { apiClient }	from "../api/api_client";
import Alert		from "../components/alert";

const Sent = (props) => {
    const [sentFriendRequests, setSentFriendRequests] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    ftReact.useEffect(async () => {
	    const getSentFriendRequests = async () => {
		    const response = await apiClient.get("/friendrequests")
		    if (response.error) {
			    setError(response.error);
			    return;
		    } 
		    setSentFriendRequests(response);
	    }
	    if (!sentFriendRequests) {
			await getSentFriendRequests();
	    }
    }, []);
    return (
        <BarLayout route={props.route}>
            {error ?
				<Alert type="danger" msg={error} />
				:
					(sentFriendRequests && sentFriendRequests.length > 0 )
					?
						<div>
							<h1>Sent Friend Requests</h1>
						</div>
					:
						<div>
							<h1>No Sent Friend Requests</h1>
						</div>
			}
        </BarLayout>
    );
};

export default Sent;
