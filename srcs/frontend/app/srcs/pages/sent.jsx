import ftReact			from "../ft_react";
import BarLayout		from "../components/barlayout";
import Alert			from "../components/alert";
import OutgoingRequests from "../components/outgoing_requests";
import { apiClient }	from "../api/api_client";

const Sent = (props) => {
    const [sentRequests, setSentRequests] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    const [limit, setLimit] = ftReact.useState(10);
    const [skip, setSkip] = ftReact.useState(0);

    ftReact.useEffect(async () => {
        setSkip(0);
        const getSentRequests = async () => {
            const response = await apiClient.get("/friendrequests", {limit: limit, skip: skip});
            if (response.error) {
                setError(response.error);
                return;
            }
			console.log(response);
            setSentRequests(response);
            setSkip(skip + limit);
        }
        if (!sentRequests) {
            await getSentRequests();
        }
    }, []);
    const loadMore = async () => {
        const response = await apiClient.get("/friendrequests", {limit: limit, skip: skip});
        if (response.error) {
            setError(response.error);
            return;
        }
        if (response.status === 'No blocked users')
            return;	
		setSentRequests([...sentRequests, ...response]);
        setSkip(skip + limit);
    }
    return (
        <BarLayout route={props.route}>
            {error ?
                <Alert type="danger" msg={error} />
                :
                    (sentRequests && sentRequests.length > 0 )
                    ?
                        <div className="d-flex flex-column gap-2 justify-content-center">
                            <OutgoingRequests requests={sentRequests} setter={setSentRequests} route={props.route} sent={true}/>
                            {sentRequests.length % limit === 0 &&
                            <div>
                                <button className="btn btn-primary" onClick={() => {loadMore()}}>
                                    Load More
                                </button>
                            </div>
                            }
                        </div>                    
                        :
                        <div>
                            <h1>No Sent Friend Requests</h1>
                        </div>
            }
        </BarLayout>
    );
}

export default Sent;