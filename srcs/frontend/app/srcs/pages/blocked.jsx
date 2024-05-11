import ftReact          from "../ft_react";
import BarLayout        from "../components/barlayout";
import Alert            from "../components/alert";
import { apiClient }    from "../api/api_client";
import BlockedUsers     from "../components/blocked_users";


const Blocked = (props) => {
    const [blockedUsers, setBlockedUsers] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);
    const [limit, setLimit] = ftReact.useState(10);
    const [skip, setSkip] = ftReact.useState(0);

    ftReact.useEffect(async () => {
        setSkip(0);
        const getBlockedUsers = async () => {
            const response = await apiClient.get("/block", {limit: limit, skip: skip});
            if (response.error) {
                setError(response.error);
                return;
            }
            setBlockedUsers(response);
            setSkip(skip + limit);
        }
        if (!blockedUsers) {
            await getBlockedUsers();
        }
    }, []);
    const loadMore = async () => {
        const response = await apiClient.get("/block", {limit: limit, skip: skip});
        if (response.error) {
            setError(response.error);
            return;
        }
        if (response.status === 'No blocked users')
            return;
        setBlockedUsers([...blockedUsers, ...response]);
        setSkip(skip + limit);
    }
    return (
        <BarLayout route={props.route}>
            {error ?
                <Alert type="danger" msg={error} />
                :
                    (blockedUsers && blockedUsers.length > 0 )
                    ?
                        <div className="border rounded p-2 d-flex flex-column gap-2 justify-content-center">
                            <BlockedUsers users={blockedUsers} setter={setBlockedUsers} route={props.route}/>
                            {blockedUsers.length % limit === 0 &&
                            <div>
                                <button className="btn btn-primary" onClick={() => {loadMore()}}>
                                    Load More
                                </button>
                            </div>
                            }
                        </div>                    
                        :
                        <div>
                            <h1>No Blocked Users</h1>
                        </div>
            }
        </BarLayout>
    );
}

export default Blocked;