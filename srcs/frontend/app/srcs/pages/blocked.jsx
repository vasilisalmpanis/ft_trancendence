import ftReact          from "../ft_react";
import BarLayout        from "../components/barlayout";
import Alert            from "../components/alert";
import { apiClient }    from "../api/api_client";


const Blocked = (props) => {
    const [blockedUsers, setBlockedUsers] = ftReact.useState(null);
    const [error, setError] = ftReact.useState(null);

    ftReact.useEffect(async () => {
        const getBlockedUsers = async () => {
            const response = await apiClient.get("/block");
            if (response.error) {
                setError(response.error);
                return;
            }
            setBlockedUsers(response);
        }
        if (!blockedUsers) {
            await getBlockedUsers();
        }
    }, []);
    return (
        <BarLayout route={props.route}>
            {error ?
                <Alert type="danger" msg={error} />
                :
                    (blockedUsers && blockedUsers.length > 0 )
                    ?
                        <div>
                            <h1>Blocked Users</h1>
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