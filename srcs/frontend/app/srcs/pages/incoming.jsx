import ftReact			from "../ft_react";
import BarLayout		from "../components/barlayout";
import Alert			from "../components/alert";
import IncomingRequests	from "../components/incoming requests";
import { apiClient }	from "../api/api_client";

const Incoming = (props) => {
    const [incomingRequests, setIncomingRequests] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    const [limit, setLimit] = ftReact.useState(10);
    const [skip, setSkip] = ftReact.useState(0);

    ftReact.useEffect(async () => {
        setSkip(0);
        const getIncomingRequests = async () => {
            const response = await apiClient.get("/friendrequests/incoming", {limit: limit, skip: skip});
            if (response.error) {
                setError(response.error);
                return;
            }
			console.log(response);
            setIncomingRequests(response);
            setSkip(skip + limit);
        }
        if (!incomingRequests) {
            await getIncomingRequests();
        }
    }, []);
    const loadMore = async () => {
        const response = await apiClient.get("/friendrequests/incoming", {limit: limit, skip: skip});
        if (response.error) {
            setError(response.error);
            return;
        }
        if (response.status === 'No blocked users')
            return;
		setIncomingRequests([...incomingRequests, ...response]);
        setSkip(skip + limit);
    }
    return (
        <BarLayout route={props.route}>
            {error ?
                <Alert type="danger" msg={error} />
                :
                    (incomingRequests && incomingRequests.length > 0 )
                    ?
                        <div className="d-flex flex-column gap-2 justify-content-center">
                            <IncomingRequests users={incomingRequests} setter={setIncomingRequests} route={props.route} sent={false}/>
                            {incomingRequests.length % limit === 0 &&
                            <div>
                                <button className="btn btn-primary" onClick={() => {loadMore()}}>
                                    Load More
                                </button>
                            </div>
                            }
                        </div>                    
                        :
                        <div>
                            <h1>No Incoming Friend Requests</h1>
                        </div>
            }
        </BarLayout>
    );
}

export default Incoming;