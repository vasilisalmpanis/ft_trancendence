import ftReact          from "../ft_react";
import { apiClient }    from "../api/api_client";
import BarLayout        from "../components/barlayout";
import Alert            from "../components/alert";
import Avatar           from "../components/avatar";
import                  '../styles/styles.css';


const LeaderboardCard = (props) => {
    let user = props.users.filter(user => user["id"] === props.data.user_id)[0];
    return (
        <tr style={{ lineHeight: '1', borderBottom: '1px solid #ddd' }}>
            <td style={{  verticalAlign: 'middle' }}>
                <div className="ml-auto" style="text-align: left;">
                    <button
                        className="btn"
                        onClick={() => {
                            props.route(`/users/${user.id}`);
                        }}
                    >
                        <div className="d-flex gap-2 align-items-center text-break" style={{minWidth: "11ch"}}>
                            <Avatar img={user.avatar} size="40rem" />
                            <span>{user.username}</span>
                        </div>
                    </button>
                </div>
            </td>
            <td style={{  verticalAlign: 'middle' }}>{`${props.data.games_won}`}</td>
            <td style={{  verticalAlign: 'middle' }}>{`${props.data.games_lost}`}</td>
            <td style={{  verticalAlign: 'middle' }}>{`${props.data.games_played}`}</td>
            <td style={{  verticalAlign: 'middle' }}>{`${props.data.total_points}`}</td>
            <td style={{  verticalAlign: 'middle' }}>{`${props.data.win_streaks}`}</td>
        </tr>
    );
}

const Leaderboard = (props) => {
    const [error, setError] = ftReact.useState(null);
    const [order, setOrder] = ftReact.useState("desc");
    const [limit, setLimit] = ftReact.useState(10);
    const [lbItems, setLbItems] = ftReact.useState(null);
    const [skip, setSkip] = ftReact.useState(0);
    const [pageEnd, setPageEnd] = ftReact.useState(false);

    const getLeaderboard = async () => {
        const data = await apiClient.get("/leaderboard", {order: order, limit: limit, skip: skip});
        if (data.error) {
            setError(data.error);
            return ;
        }
        else if (data.error === "no connection") {
            setError("No connection");
            return ;
        }
        let temp = [];
        if (data.length === 0)
        {
            setError("No data");
            return ;
        }
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            if (user.error) {
                setError(user.error);
                return ;
            }
            temp.push(user);
        }
        setLbItems(data.map(player => <LeaderboardCard data={player} users={temp} route={props.route}/>));
        setSkip(skip + limit);
    }
    const updateLeaderBoard = async () => {
        const data = await apiClient.get("/leaderboard", {order: order, limit: limit, skip: skip});
        if (data.error) {
            setError(data.error);
            return ;
        }
        let temp = [];
        if (data.length === 0) {
            setPageEnd(true);
            return ;
        }
        for (let i = 0; i < data.length; i++)
        {
            const user = await apiClient.get(`/users/${data[i].user_id}`);
            if (user.error) {
                setError(user.error);
                return ;
            }
            temp.push(user);
        }
        setLbItems([...lbItems, ...data.map(player => <LeaderboardCard data={player} users={temp} route={props.route}/>)]);
        setSkip(skip + limit);
    }
    if (!lbItems && !error)
        getLeaderboard();
    return (
        <BarLayout route={props.route}>
            {
                lbItems 
                ? 
                <div>
                    <h1>Leaderboard</h1>
                <div style={{overflowX: "auto", maxWidth: "100vw"}}>
                    <table className="table table-bordered rounded">
                    <thead>
                        <tr>
                        <th>User</th>
                        <th>Games Won</th>
                        <th>Games Lost</th>
                        <th>Games Played</th>
                        <th>Total Points</th>
                        <th>Winstreak</th>
                        </tr>
                    </thead>
                        <tbody>
                            {lbItems}
                        </tbody>
                    </table>
                </div>
                    {   !pageEnd && 
                        lbItems &&
                        lbItems.length > 0 &&
                        lbItems.length % limit == 0 
                        &&  <button className="btn btn-primary" onClick={() =>
                                {
                                    updateLeaderBoard();
                                }}>Load more
                            </button>
                    }
                    </div>
                : error
                ?
                <Alert msg={error}/>
                : (
                    <div className="spinner-grow" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                )
            }
        </BarLayout>
    );
}

export default Leaderboard;